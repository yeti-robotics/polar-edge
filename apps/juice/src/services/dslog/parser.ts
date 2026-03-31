import { AbstractLogParser, type ParseResult } from "../parser";
import type { DSLogHeader, DSLogParsedRecord, DSLogRecord, PdpType, StatusFlags } from "./types";

/** LabVIEW epoch (Jan 1, 1904) offset from Unix epoch in seconds */
const LABVIEW_EPOCH_OFFSET = -2_082_844_800;
const RECORD_INTERVAL_MS = 20;
const HEADER_SIZE = 20;
const V3_RECORD_SIZE = 35;
const GENERAL_SIZE = 10;
const PD_HEADER_SIZE = 4;

export class DSLogParser extends AbstractLogParser<DSLogParsedRecord> {
  readonly extensions = [".dslog"];
  readonly logType = "dslog" as const;

  parse(buffer: ArrayBuffer): ParseResult<DSLogParsedRecord> {
    const view = new DataView(buffer);
    const header = parseHeader(view);
    const rawRecords = parseRecords(view, header);

    const records: DSLogParsedRecord[] = rawRecords.map((r) => ({
      timestamp: r.timestamp.getTime(),
      tripTimeMs: r.tripTimeMs,
      packetLossPercent: r.packetLossPercent,
      voltageV: r.voltageV,
      rioCpuPercent: r.rioClCpuPercent,
      canUtilizationPercent: r.canUtilizationPercent,
      wifiDbm: r.wifiDbm,
      bandwidthMbps: r.bandwidthMbps,
      robotDisabled: r.status.robotDisabled,
      robotAuto: r.status.robotAuto,
      robotTeleop: r.status.robotTeleop,
      brownout: r.status.brownout,
      watchdog: r.status.watchdog,
      pdpChannels: r.pdpChannels,
      pdpVoltage: r.pdpVoltage,
    }));

    const firstTs = records[0]?.timestamp ?? 0;
    const lastTs = records[records.length - 1]?.timestamp ?? 0;

    return { records, startTime: firstTs, endTime: lastTs };
  }
}

function parseHeader(view: DataView): DSLogHeader {
  const version = view.getInt32(0, false);
  if (version !== 3 && version !== 4) {
    throw new Error(`Unsupported dslog version: ${version}`);
  }

  const seconds = Number(view.getBigInt64(4, false));
  const fraction = view.getBigUint64(12, false);
  const fractionSeconds = Number(fraction) / 2 ** 64;
  const unixSeconds = seconds + LABVIEW_EPOCH_OFFSET + fractionSeconds;

  return {
    version,
    timestamp: new Date(unixSeconds * 1000),
  };
}

function parseRecords(view: DataView, header: DSLogHeader): DSLogRecord[] {
  const records: DSLogRecord[] = [];
  let offset = HEADER_SIZE;

  if (header.version === 3) {
    while (offset + V3_RECORD_SIZE <= view.byteLength) {
      const recordIndex = records.length;
      const timestamp = new Date(header.timestamp.getTime() + recordIndex * RECORD_INTERVAL_MS);
      records.push(parseV3Record(view, offset, timestamp));
      offset += V3_RECORD_SIZE;
    }
  } else {
    // Version 4: variable-size records based on PDP type
    while (offset + GENERAL_SIZE + PD_HEADER_SIZE <= view.byteLength) {
      const recordIndex = records.length;
      const timestamp = new Date(header.timestamp.getTime() + recordIndex * RECORD_INTERVAL_MS);
      const { record, bytesRead } = parseV4Record(view, offset, timestamp);
      records.push(record);
      offset += bytesRead;
    }
  }

  return records;
}

function parseGeneralSection(
  view: DataView,
  offset: number
): Omit<
  DSLogRecord,
  "timestamp" | "pdpChannels" | "pdpVoltage" | "pdpTemperature" | "pdpResistance"
> {
  const tripTimeMs = view.getUint8(offset) * 0.5;
  const packetLossPercent = view.getUint8(offset + 1) * 4 * 0.01;
  const voltageV = view.getUint16(offset + 2, false) / 256.0;
  const rioClCpuPercent = view.getUint8(offset + 4) * 0.5 * 0.01;
  const status = parseStatusFlags(view.getUint8(offset + 5));
  const canUtilizationPercent = view.getUint8(offset + 6) * 0.5 * 0.01;
  const wifiDbm = view.getUint8(offset + 7) * 0.5;
  const bandwidthMbps = view.getUint16(offset + 8, false) / 256.0;

  return {
    tripTimeMs,
    packetLossPercent,
    voltageV,
    rioClCpuPercent,
    status,
    canUtilizationPercent,
    wifiDbm,
    bandwidthMbps,
  };
}

function parseStatusFlags(byte: number): StatusFlags {
  // Bits are active-low (0 = condition is true)
  return {
    brownout: (byte & 0x80) === 0,
    watchdog: (byte & 0x40) === 0,
    dsTeleop: (byte & 0x20) === 0,
    dsAuto: (byte & 0x10) === 0,
    dsDisabled: (byte & 0x08) === 0,
    robotTeleop: (byte & 0x04) === 0,
    robotAuto: (byte & 0x02) === 0,
    robotDisabled: (byte & 0x01) === 0,
  };
}

// --- PDP bit extraction ---

/** Extract an 8-bit value from a 10-bit slot at a given bit offset */
function extractChannel(bytes: Uint8Array, bitOffset: number): number {
  const byteIndex = Math.floor(bitOffset / 8);
  const bitShift = bitOffset % 8;

  const b0 = bytes[byteIndex] ?? 0;
  const b1 = bytes[byteIndex + 1] ?? 0;
  const combined = (b0 << 8) | b1;

  return (combined >> (8 - bitShift)) & 0xff;
}

/**
 * CTRE PDP: 16 channels in 10-bit slots, grouped in 64-bit blocks (6 per block).
 * Offsets include +8 for the 1-byte CAN ID at the start of pdpBytes.
 * Formula: floor(i/6)*64 + (i%6)*10 + 8
 */
const CTRE_CHANNEL_BIT_OFFSETS = Array.from({ length: 16 }, (_, i) =>
  Math.floor(i / 6) * 64 + (i % 6) * 10 + 8
);

function parseCtrePdp(pdpBytes: Uint8Array): {
  channels: number[];
  voltage: number | null;
  temperature: number | null;
  resistance: number | null;
} {
  const channels = CTRE_CHANNEL_BIT_OFFSETS.map(
    (bitOffset) => extractChannel(pdpBytes, bitOffset) / 8.0
  );

  const resistance = pdpBytes[22] ?? null;
  const voltage = pdpBytes[23] != null ? pdpBytes[23] * 0.0736 : null;
  const temperature = pdpBytes[24] ?? null;

  return { channels, voltage, temperature, resistance };
}

/**
 * REV PDH: 20 main channels in 10-bit slots, grouped in 32-bit blocks (3 per block),
 * plus 4 extra single-byte channels (divided by 16 instead of 8).
 * Offsets include +8 for the 1-byte CAN ID.
 * Formula: floor(i/3)*32 + (i%3)*10 + 8
 */
const REV_CHANNEL_BIT_OFFSETS = Array.from({ length: 20 }, (_, i) =>
  Math.floor(i / 3) * 32 + (i % 3) * 10 + 8
);

function parseRevPdh(pdpBytes: Uint8Array): {
  channels: number[];
  voltage: number | null;
  temperature: number | null;
  resistance: number | null;
} {
  // 20 main channels from bit-packed data
  const channels = REV_CHANNEL_BIT_OFFSETS.map(
    (bitOffset) => extractChannel(pdpBytes, bitOffset) / 8.0
  );

  // 4 extra single-byte channels after CAN ID (1) + packed data (27)
  const extraStart = 28;
  for (let i = 0; i < 4; i++) {
    channels.push((pdpBytes[extraStart + i] ?? 0) / 16.0);
  }

  // Temperature is the last byte
  const temperature = pdpBytes[extraStart + 4] ?? null;

  return { channels, voltage: null, temperature, resistance: null };
}

// --- Version-specific record parsers ---

function spreadPdp(pdp: {
  channels: number[];
  voltage: number | null;
  temperature: number | null;
  resistance: number | null;
}) {
  return {
    pdpChannels: pdp.channels,
    pdpVoltage: pdp.voltage,
    pdpTemperature: pdp.temperature,
    pdpResistance: pdp.resistance,
  };
}

function parseV3Record(view: DataView, offset: number, timestamp: Date): DSLogRecord {
  const general = parseGeneralSection(view, offset);
  const pdpBytes = new Uint8Array(view.buffer, offset + GENERAL_SIZE, 25);
  const pdp = parseCtrePdp(pdpBytes);

  return { ...general, timestamp, ...spreadPdp(pdp) };
}

function parseV4Record(
  view: DataView,
  offset: number,
  timestamp: Date
): { record: DSLogRecord; bytesRead: number } {
  const general = parseGeneralSection(view, offset);

  // PD type ID is the 4th byte of the PD header (record offset +13)
  const pdpTypeOffset = offset + GENERAL_SIZE + 3;
  const pdpTypeByte = view.getUint8(pdpTypeOffset);
  const pdpType = detectPdpType(pdpTypeByte);

  let pdpDataSize: number;
  let pdp: {
    channels: number[];
    voltage: number | null;
    temperature: number | null;
    resistance: number | null;
  };

  // PDP channel data starts after the 4-byte PD header
  const pdpDataStart = offset + GENERAL_SIZE + PD_HEADER_SIZE;

  switch (pdpType) {
    case "ctre": {
      pdpDataSize = 25;
      const pdpBytes = new Uint8Array(view.buffer, pdpDataStart, pdpDataSize);
      pdp = parseCtrePdp(pdpBytes);
      break;
    }
    case "rev": {
      pdpDataSize = 33;
      const pdpBytes = new Uint8Array(view.buffer, pdpDataStart, pdpDataSize);
      pdp = parseRevPdh(pdpBytes);
      break;
    }
    default:
      pdpDataSize = 0;
      pdp = { channels: [], voltage: null, temperature: null, resistance: null };
      break;
  }

  return {
    record: { ...general, timestamp, ...spreadPdp(pdp) },
    bytesRead: GENERAL_SIZE + PD_HEADER_SIZE + pdpDataSize,
  };
}

function detectPdpType(byte: number): PdpType {
  switch (byte) {
    case 25:
      return "ctre";
    case 33:
      return "rev";
    default:
      return "none";
  }
}
