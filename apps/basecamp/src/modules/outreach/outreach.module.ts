import { Module } from "@nestjs/common";
import { AppConfigService } from "src/config/config.service";
import { type SheetCredentials, SheetService } from "src/lib/sheet/sheet.service";
import { OutreachService } from "./outreach.service";

@Module({
  providers: [
    {
      provide: SheetService,
      useFactory: (config: AppConfigService) => {
        const credentials = JSON.parse(
          Buffer.from(config.get("googleCredentials"), "base64").toString("utf-8")
        ) as SheetCredentials;
        return new SheetService(credentials, config.get("outreachSpreadsheetId"));
      },
      inject: [AppConfigService],
    },
    OutreachService,
  ],
  exports: [OutreachService],
})
export class OutreachModule {}
