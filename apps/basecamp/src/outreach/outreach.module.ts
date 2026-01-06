import { Module } from "@nestjs/common";
import { SheetModule } from "src/sheet/sheet.module";
import { OutreachService } from "./outreach.service";

@Module({
  imports: [SheetModule],
  providers: [OutreachService],
  exports: [OutreachService],
})
export class OutreachModule {}
