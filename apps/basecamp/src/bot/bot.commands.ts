import { Injectable } from "@nestjs/common";
import { MessageFlags } from "discord.js";
import { Context, SlashCommand, type SlashCommandContext } from "necord";

@Injectable()
export class BotCommands {
  @SlashCommand({
    name: "ping",
    description: "Ping the bot",
    dmPermission: true,
  })
  public async onPing(@Context() [interaction]: SlashCommandContext) {
    return interaction.reply({
      content: `Pong! ${interaction.client.ws.ping}ms`,
      flags: [MessageFlags.Ephemeral],
    });
  }
}
