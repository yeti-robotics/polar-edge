import { Module } from "@nestjs/common";
import { SheetService } from "./sheet.service";

export interface SheetModuleOptions {
  config: {
    spreadsheetId: string;
  };
}

@Module({
  providers: [SheetService],
  exports: [SheetService],
})
export class SheetModule {}
