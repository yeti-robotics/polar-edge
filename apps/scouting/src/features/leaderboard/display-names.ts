import "server-only";

import type { MemberCount } from "./queries";

type MemberCountRow = MemberCount & {
  discordUserId: string | null;
};

type DiscordGuildMember = {
  nick?: string | null;
};

function getDiscordGuildConfig() {
  const token = process.env.DISCORD_BOT_TOKEN ?? process.env.DISCORD_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID ?? process.env.YETI_SERVER_ID;

  if (!token || !guildId) {
    return null;
  }

  return { token, guildId };
}

function stripDiscordUserId(row: MemberCountRow, userName = row.userName): MemberCount {
  const { discordUserId: _discordUserId, ...scout } = row;
  return { ...scout, userName };
}

async function getDiscordGuildNickname(discordUserId: string): Promise<string | null> {
  const config = getDiscordGuildConfig();
  if (!config) {
    return null;
  }

  const response = await fetch(
    `https://discord.com/api/v10/guilds/${config.guildId}/members/${discordUserId}`,
    {
      cache: "no-store",
      headers: {
        Authorization: `Bot ${config.token}`,
      },
    }
  );

  if (!response.ok) {
    return null;
  }

  const member = (await response.json()) as DiscordGuildMember;
  return member.nick?.trim() || null;
}

export async function resolveLeaderboardDisplayNames(
  rows: MemberCountRow[]
): Promise<MemberCount[]> {
  if (rows.length === 0) {
    return rows;
  }

  const config = getDiscordGuildConfig();
  if (!config) {
    return rows.map((row) => stripDiscordUserId(row));
  }

  const resolvedRows = await Promise.all(
    rows.map(async (row) => {
      if (!row.discordUserId) {
        return stripDiscordUserId(row);
      }

      const nickname = await getDiscordGuildNickname(row.discordUserId);
      return stripDiscordUserId(row, nickname ?? row.userName);
    })
  );

  return resolvedRows;
}
