import { type ChatInputCommandInteraction } from "discord.js";
import { err, ok, ResultAsync } from "neverthrow";

/**
 * Gets the nickname of a user from a Discord ChatInputCommandInteraction
 *
 * Returns a ResultAsync containing the nickname or an error if the nickname is not found
 *
 * @param interaction - The interaction to get the nickname from
 * @returns A result containing the nickname or an error if the nickname is not found
 */
export function getNickname(interaction: ChatInputCommandInteraction) {
  const fetchPromise =
    interaction.guild?.members.fetch(interaction.user.id) ??
    Promise.reject(new Error("Guild not found"));

  return ResultAsync.fromPromise(
    fetchPromise,
    (e) => new Error(`Failed to get nickname: ${e instanceof Error ? e.message : String(e)}`)
  ).andThen((member) =>
    member.nickname ? ok(member.nickname) : err(new Error("Nickname not found"))
  );
}
