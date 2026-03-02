import { Module } from "@nestjs/common";
import { ThrottlerModule } from "@nestjs/throttler";
import { AiModule } from "../../lib/ai/ai.module";
import { HandbookCommands } from "./handbook.commands";
import { NecordThrottlerGuard } from "./handbook.guard";
import { HandbookService } from "./handbook.service";

@Module({
  imports: [AiModule, ThrottlerModule.forRoot([{ name: "default", limit: 2, ttl: 60000 }])],
  providers: [HandbookService, HandbookCommands, NecordThrottlerGuard],
  exports: [HandbookService],
})
export class HandbookModule {}
