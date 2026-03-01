import { Logger } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SheetCredentials, SheetService } from "./sheet.service";

const MOCK_CREDENTIALS: SheetCredentials = {
  client_email: "test@example.com",
  private_key: "test-private-key",
};
const MOCK_SPREADSHEET_ID = "test-spreadsheet-id";

const { mockGet, mockAppend } = vi.hoisted(() => ({
  mockGet: vi.fn(),
  mockAppend: vi.fn(),
}));

vi.mock("@googleapis/sheets", () => ({
  sheets: vi.fn().mockReturnValue({
    spreadsheets: {
      values: {
        get: mockGet,
        append: mockAppend,
      },
    },
  }),
}));

describe("SheetService", () => {
  let service: SheetService;

  beforeEach(async () => {
    vi.clearAllMocks();
    mockGet.mockResolvedValue({ data: { values: [["test-value"]] } });
    mockAppend.mockResolvedValue({});

    const module = await Test.createTestingModule({
      providers: [
        {
          provide: SheetService,
          useFactory: () => new SheetService(MOCK_CREDENTIALS, MOCK_SPREADSHEET_ID),
        },
        Logger,
      ],
    }).compile();

    service = module.get(SheetService);
  });

  describe("get", () => {
    it("should return the sheet values", async () => {
      const result = await service.get("A1:B2");

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual([["test-value"]]);
      expect(mockGet).toHaveBeenCalledTimes(1);
      expect(mockGet).toHaveBeenCalledWith({
        spreadsheetId: MOCK_SPREADSHEET_ID,
        range: "A1:B2",
      });
    });

    it("should return empty array when sheet has no values", async () => {
      mockGet.mockResolvedValue({ data: {} });

      const result = await service.get("C1:D1");

      expect(result.isOk()).toBe(true);
      expect(result._unsafeUnwrap()).toEqual([]);
      expect(mockGet).toHaveBeenCalledWith({
        spreadsheetId: MOCK_SPREADSHEET_ID,
        range: "C1:D1",
      });
    });

    it("should return an error when the sheet sdk throws an error", async () => {
      const cause = "Sheet API error";
      mockGet.mockRejectedValueOnce(new Error(cause));
      const result = await service.get("A1:B2");
      expect(result.isErr()).toBe(true);
    });
  });

  describe("append", () => {
    it("should append values with USER_ENTERED by default", async () => {
      const result = await service.append("Sheet1!A1", [["row1"], ["row2"]]);

      expect(result.isOk()).toBe(true);
      expect(mockAppend).toHaveBeenCalledTimes(1);
      expect(mockAppend).toHaveBeenCalledWith({
        spreadsheetId: MOCK_SPREADSHEET_ID,
        range: "Sheet1!A1",
        valueInputOption: "USER_ENTERED",
        requestBody: { values: [["row1"], ["row2"]] },
      });
    });

    it("should use RAW when valueInputOption is specified", async () => {
      const result = await service.append("Sheet1!B2", [["raw"]], {
        valueInputOption: "RAW",
      });

      expect(result.isOk()).toBe(true);
      expect(mockAppend).toHaveBeenCalledWith(
        expect.objectContaining({
          valueInputOption: "RAW",
          requestBody: { values: [["raw"]] },
        })
      );
    });

    it("should return an error when the sheet sdk throws an error", async () => {
      const cause = "Sheet API error";
      mockAppend.mockRejectedValueOnce(new Error(cause));
      const result = await service.append("Sheet1!A1", [["row1"], ["row2"]]);
      expect(result.isErr()).toBe(true);
    });
  });
});
