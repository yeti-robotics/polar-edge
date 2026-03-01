import { Module } from "@nestjs/common";
import { AppConfigService } from "src/config/config.service";
import { SheetService } from "src/lib/sheet/sheet.service";
import { OutreachCommands } from "./outreach.commands";
import { OutreachRepository } from "./outreach.repository";
import { OutreachService } from "./outreach.service";

@Module({
  providers: [
    {
      provide: SheetService,
      useFactory: (config: AppConfigService) =>
        new SheetService(config.get("googleCredentials"), config.get("outreachSpreadsheetId")),
      inject: [AppConfigService],
    },
    OutreachRepository,
    OutreachService,
    OutreachCommands,
  ],
  exports: [OutreachService],
})
export class OutreachModule {}
