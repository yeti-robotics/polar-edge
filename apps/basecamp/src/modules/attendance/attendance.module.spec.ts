import { CacheModule } from "@nestjs/cache-manager";
import { Global, Module as NestModule } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { Test, type TestingModule } from "@nestjs/testing";
import { AppConfigService } from "src/config/config.service";
import { type SheetCredentials } from "src/lib/sheet/sheet.service";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ATTENDANCE_CACHE_TTL_MS } from "./attendance.constants";
import { AttendanceModule } from "./attendance.module";
import { AttendanceService } from "./attendance.service";

const { MockSheetService } = vi.hoisted(() => ({
  MockSheetService: vi.fn(),
}));

vi.mock("src/lib/sheet/sheet.service", () => ({
  SheetService: MockSheetService,
}));

const mockCredentials: SheetCredentials = {
  client_email: "test@project.iam.gserviceaccount.com",
  private_key: "test-private-key",
};

const mockConfig = {
  get: vi.fn((key: string) => {
    if (key === "googleCredentials") return mockCredentials;
    if (key === "attendanceSpreadsheetId") return "attendance-sheet-id";
  }),
};

@Global()
@NestModule({
  providers: [{ provide: AppConfigService, useValue: mockConfig }],
  exports: [AppConfigService],
})
class MockConfigModule {}

describe("AttendanceModule", () => {
  let module: TestingModule;

  beforeEach(async () => {
    MockSheetService.mockClear();
    mockConfig.get.mockClear();

    module = await Test.createTestingModule({
      imports: [
        CacheModule.register({ isGlobal: true }),
        MockConfigModule,
        JwtModule.register({ global: true }),
        AttendanceModule,
      ],
    }).compile();
  });

  it("should compile successfully", () => {
    expect(module).toBeDefined();
  });

  it("should instantiate SheetService with credentials and spreadsheet id from config", () => {
    expect(MockSheetService).toHaveBeenCalledWith(
      mockCredentials,
      "attendance-sheet-id",
      expect.anything(),
      ATTENDANCE_CACHE_TTL_MS
    );
  });

  it("should export AttendanceService", () => {
    const service = module.get(AttendanceService);
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(AttendanceService);
  });
});
