import { Injectable, Logger } from "@nestjs/common";
import { ActivityType } from "discord.js";
import { Context, type ContextOf, Once } from "necord";

@Injectable()
export class LifecycleService {
  private readonly logger = new Logger(LifecycleService.name);

  @Once("clientReady")
  public async onReady(@Context() [client]: ContextOf<"clientReady">): Promise<void> {
    this.logger.log(`Bot logged in as ${client.user.username}`);

    client.user.setActivity("YETI ARE YOU READY?", { type: ActivityType.Custom });
  }
}
