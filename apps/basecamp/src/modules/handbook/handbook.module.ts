import { Module } from "@nestjs/common";
import { AiModule } from "../../lib/ai/ai.module";
import { HandbookCommands } from "./handbook.commands";
import { HandbookService } from "./handbook.service";

@Module({
  imports: [AiModule],
  providers: [HandbookService, HandbookCommands],
  exports: [HandbookService],
})
export class HandbookModule {}
