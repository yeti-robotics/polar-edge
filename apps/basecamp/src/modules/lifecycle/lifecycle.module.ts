import { Module } from "@nestjs/common";
import { LifecycleCommands } from "./lifecycle.commands";
import { LifecycleService } from "./lifecycle.service";

@Module({
  imports: [],
  providers: [LifecycleCommands, LifecycleService],
})
export class LifecycleModule {}
