interface LeaderboardEntry {
  userName: string;
  totalHours: number;
}

const RANK_PREFIXES: Record<number, string> = {
  1: ":first_place_medal:",
  2: ":second_place_medal:",
  3: ":third_place_medal:",
};

/**
 * Formats a leaderboard for Discord display with medal emojis for the top 3.
 *
 * @param header - The header line (e.g., ":clock: **Attendance Leaderboard** :clock:")
 * @param entries - The leaderboard entries, already sorted by rank
 * @param footer - The footer line (e.g., "*Updated in real-time from attendance records*")
 * @returns The formatted leaderboard string
 */
export function formatLeaderboard(
  header: string,
  entries: LeaderboardEntry[],
  footer: string
): string {
  let result = `${header}\n\n`;

  entries.forEach((entry, index) => {
    const prefix = RANK_PREFIXES[index + 1] ?? `${index + 1}.`;
    result += `${prefix} **${entry.userName}** - ${entry.totalHours} hours\n`;
  });

  result += `\n${footer}`;
  return result;
}
