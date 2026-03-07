import { CACHE_MANAGER } from "@nestjs/cache-manager";
import { Module } from "@nestjs/common";
import type { Cache } from "cache-manager";
import { AppConfigService } from "src/config/config.service";
import { SheetService } from "src/lib/sheet/sheet.service";
import { OutreachCommands } from "./outreach.commands";
import { OUTREACH_CACHE_TTL_MS } from "./outreach.constants";
import { OutreachRepository } from "./outreach.repository";
import { OutreachService } from "./outreach.service";

@Module({
  providers: [
    {
      provide: SheetService,
      useFactory: (config: AppConfigService, cache: Cache) =>
        new SheetService(
          config.get("googleCredentials"),
          config.get("outreachSpreadsheetId"),
          cache,
          OUTREACH_CACHE_TTL_MS
        ),
      inject: [AppConfigService, CACHE_MANAGER],
    },
    OutreachRepository,
    OutreachService,
    OutreachCommands,
  ],
  exports: [OutreachService],
})
export class OutreachModule {}
