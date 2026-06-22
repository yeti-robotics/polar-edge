import type { CANCurrentPoint, DSLogParseResult, DSVoltagePoint } from "../analysis/types";

const WPILOG_MAGIC = "WPILOG";

function readUintLE(view: DataView, offset: number, size: number): number {
  let val = 0;
  for (let i = 0; i < size; i++) {
    val += (view.getUint8(offset + i) ?? 0) * 2 ** (8 * i);
  }
  return val;
}

function readWpiString(view: DataView, offset: number): { value: string; byteLen: number } {
  if (offset + 4 > view.byteLength) return { value: "", byteLen: 4 };
  const len = view.getUint32(offset, true);
  if (offset + 4 + len > view.byteLength) return { value: "", byteLen: 4 + len };
  const bytes = new Uint8Array(view.buffer, view.byteOffset + offset + 4, len);
  return { value: new TextDecoder().decode(bytes), byteLen: 4 + len };
}

function isVoltageEntry(name: string, type: string): boolean {
  if (type !== "double" && type !== "float") return false;
  const n = name.toLowerCase();
  if (n === "/powerdistribution/inputvoltage") return true;
  if (n.endsWith("/inputvoltage") || n.endsWith("/batteryvoltage")) return true;
  if (n.includes("battery") && n.includes("voltage")) return true;
  // Generic "voltage" but not per-motor/channel voltages
  if (n.includes("voltage") && !n.match(/channel|motor|stator|supply|output|reverse/)) return true;
  return false;
}

function isTotalCurrentEntry(name: string, type: string): boolean {
  if (type !== "double" && type !== "float") return false;
  const n = name.toLowerCase();
  return (
    n.includes("totalcurrent") ||
    (n.endsWith("/current") && !n.match(/channel\d/))
  );
}

function getChannelIndex(name: string, type: string): number | null {
  if (type !== "double" && type !== "float") return null;
  const m =
    name.match(/[Cc]hannel(\d+)[Cc]urrent/) ??
    name.match(/[Cc]hannel(\d+)/) ??
    name.match(/\/[Cc][Hh](\d+)$/);
  if (m?.[1] !== undefined) {
    const ch = parseInt(m[1], 10);
    if (ch >= 0 && ch < 24) return ch;
  }
  return null;
}

function isChannelArrayEntry(name: string, type: string): boolean {
  if (type !== "double[]" && type !== "float[]") return false;
  const n = name.toLowerCase();
  return n.includes("channel") || (n.includes("current") && (n.includes("pdh") || n.includes("pdp")));
}

/**
 * Parse a WPILog v1.0 binary file (.wpilog).
 * Extracts voltage, total current, and per-channel PDH/PDP currents.
 * Returns the same DSLogParseResult shape as the dslog parser.
 */
export function parseWPILog(buffer: ArrayBuffer): DSLogParseResult | null {
  if (buffer.byteLength < 12) return null;

  const view = new DataView(buffer);
  const bytes = new Uint8Array(buffer);

  // Validate magic bytes
  const magic = String.fromCharCode(
    bytes[0] ?? 0, bytes[1] ?? 0, bytes[2] ?? 0,
    bytes[3] ?? 0, bytes[4] ?? 0, bytes[5] ?? 0,
  );
  if (magic !== WPILOG_MAGIC) return null;

  // Only support v1.x
  const version = view.getUint16(6, true);
  if ((version >> 8) !== 1) return null;

  const extraLen = view.getUint32(8, true);
  let pos = 12 + extraLen;

  // Entry registry
  const entryTypes = new Map<number, string>(); // entryId -> type string

  // Role assignments (determined from Start control records)
  let voltageId = -1;
  let totalCurrentId = -1;
  const channelIdToChNum = new Map<number, number>(); // entryId -> channel 0-23
  let channelArrayId = -1;

  // Time series collectors
  const voltPts: { us: number; v: number }[] = [];
  const currPts: { us: number; c: number }[] = [];
  const chPts = new Map<number, { us: number; v: number }[]>(); // chNum -> pts
  const chArrayPts: { us: number; vs: number[] }[] = [];

  while (pos < bytes.byteLength) {
    const bf = bytes[pos++];
    if (bf === undefined) break;

    const idSize = (bf & 0x3) + 1;
    const plSize = ((bf >> 2) & 0x3) + 1;
    const tsSize = ((bf >> 4) & 0x7) + 1;

    if (pos + idSize + plSize + tsSize > bytes.byteLength) break;

    const entryId = readUintLE(view, pos, idSize);
    pos += idSize;
    const payloadSize = readUintLE(view, pos, plSize);
    pos += plSize;
    const timestampUs = readUintLE(view, pos, tsSize);
    pos += tsSize;

    const payloadStart = pos;
    if (payloadStart + payloadSize > bytes.byteLength) break;

    if (entryId === 0) {
      // Control record
      const ctrlType = bytes[payloadStart];
      if (ctrlType === 0 && payloadSize >= 5) {
        // Start record: register a new entry
        const newId = view.getUint32(payloadStart + 1, true);
        let sp = payloadStart + 5;
        const { value: name, byteLen: nl } = readWpiString(view, sp);
        sp += nl;
        const { value: type } = readWpiString(view, sp);

        entryTypes.set(newId, type);

        // Assign a role based on name + type
        if (voltageId === -1 && isVoltageEntry(name, type)) {
          voltageId = newId;
        } else if (totalCurrentId === -1 && isTotalCurrentEntry(name, type)) {
          totalCurrentId = newId;
        } else {
          const ch = getChannelIndex(name, type);
          if (ch !== null) {
            channelIdToChNum.set(newId, ch);
          } else if (channelArrayId === -1 && isChannelArrayEntry(name, type)) {
            channelArrayId = newId;
          }
        }
      }
    } else {
      // Data record
      const type = entryTypes.get(entryId);
      if (type) {
        try {
          const readScalar = (): number =>
            type === "float"
              ? view.getFloat32(payloadStart, true)
              : view.getFloat64(payloadStart, true);

          if (entryId === voltageId) {
            const v = readScalar();
            if (Number.isFinite(v) && v > 3 && v < 16) {
              voltPts.push({ us: timestampUs, v });
            }
          } else if (entryId === totalCurrentId) {
            const c = readScalar();
            if (Number.isFinite(c) && c >= 0 && c < 1000) {
              currPts.push({ us: timestampUs, c });
            }
          } else if (channelIdToChNum.has(entryId)) {
            const chNum = channelIdToChNum.get(entryId)!;
            const c = readScalar();
            if (Number.isFinite(c)) {
              let arr = chPts.get(chNum);
              if (!arr) { arr = []; chPts.set(chNum, arr); }
              arr.push({ us: timestampUs, v: c });
            }
          } else if (entryId === channelArrayId) {
            const count = view.getUint32(payloadStart, true);
            const stride = type === "float[]" ? 4 : 8;
            const vs: number[] = [];
            for (let i = 0; i < count; i++) {
              const off = payloadStart + 4 + i * stride;
              vs.push(type === "float[]" ? view.getFloat32(off, true) : view.getFloat64(off, true));
            }
            chArrayPts.push({ us: timestampUs, vs });
          }
        } catch {
          // skip malformed payload
        }
      }
    }

    pos = payloadStart + payloadSize;
  }

  if (voltPts.length < 10) return null;

  voltPts.sort((a, b) => a.us - b.us);
  const startUs = voltPts[0]!.us;

  const voltage: DSVoltagePoint[] = voltPts.map((p) => ({
    t: +((p.us - startUs) / 1_000_000).toFixed(3),
    v: +p.v.toFixed(4),
  }));

  const current: CANCurrentPoint[] = currPts
    .sort((a, b) => a.us - b.us)
    .map((p) => ({
      t: +((p.us - startUs) / 1_000_000).toFixed(3),
      current: +p.c.toFixed(3),
    }));

  const channels: Record<string, number[]> = {};

  if (chPts.size > 0) {
    for (const [chNum, pts] of chPts) {
      pts.sort((a, b) => a.us - b.us);
      channels[`CH ${chNum}`] = resampleToTimeline(pts, voltPts);
    }
  } else if (chArrayPts.length > 0) {
    chArrayPts.sort((a, b) => a.us - b.us);
    const numCh = Math.max(...chArrayPts.map((p) => p.vs.length));
    for (let ch = 0; ch < numCh; ch++) {
      const pts = chArrayPts.map((p) => ({ us: p.us, v: p.vs[ch] ?? 0 }));
      channels[`CH ${ch}`] = resampleToTimeline(pts, voltPts);
    }
  }

  return { voltage, current, channels };
}

function resampleToTimeline(
  src: { us: number; v: number }[],
  target: { us: number }[],
): number[] {
  if (src.length === 0) return target.map(() => 0);
  const result: number[] = [];
  let si = 0;
  for (const tp of target) {
    const tUs = tp.us;
    while (si < src.length - 1 && (src[si + 1]?.us ?? tUs) <= tUs) si++;
    const s0 = src[si];
    const s1 = src[si + 1];
    if (s0 && s1 && tUs >= s0.us && tUs <= s1.us && s1.us !== s0.us) {
      const frac = (tUs - s0.us) / (s1.us - s0.us);
      result.push(+(s0.v + frac * (s1.v - s0.v)).toFixed(3));
    } else {
      result.push(+(s0?.v ?? 0).toFixed(3));
    }
  }
  return result;
}
