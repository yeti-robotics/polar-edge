import { Module } from "@nestjs/common";
import { AiModule } from "../ai/ai.module";
import { HandbookService } from "./handbook.service";

@Module({
  imports: [AiModule],
  providers: [HandbookService],
  exports: [HandbookService],
})
export class HandbookModule {}
