import type { Rating } from "openskill";
import { ordinal, rate, rating } from "openskill";
import type { DriveRatingHistoryPoint, DriveTeamRating } from "./types";

type RankingObservation = {
  matchNumber: number;
  matchType: string;
  /** Team numbers in rank order: [1st, 2nd, 3rd] */
  rankedTeams: number[];
};

/**
 * Compute OpenSkill ratings from a chronological list of ranking observations.
 * Each observation is a 1v1v1 where each "team" is a single-player team.
 *
 * Returns current ratings and per-team match-by-match history.
 */
export function computeDriveRatings(
  observations: RankingObservation[],
  teamNames: Map<number, string>
): {
  ratings: DriveTeamRating[];
  history: Map<number, DriveRatingHistoryPoint[]>;
} {
  const teamRatings = new Map<number, Rating>();
  const teamMatchCount = new Map<number, number>();
  const history = new Map<number, DriveRatingHistoryPoint[]>();

  for (const obs of observations) {
    // Build teams array for openskill: each team is [rating]
    const teams = obs.rankedTeams.map((teamNum) => {
      if (!teamRatings.has(teamNum)) {
        teamRatings.set(teamNum, rating());
      }
      return [teamRatings.get(teamNum) as Rating];
    });

    // rank array: [1, 2, 3] means first team placed 1st, etc.
    const updated = rate(teams, { rank: [1, 2, 3] });

    // Update ratings and record history
    for (let i = 0; i < obs.rankedTeams.length; i++) {
      const teamNum = obs.rankedTeams[i] as number;
      const newRating = updated[i]?.[0];
      if (!newRating) continue;

      teamRatings.set(teamNum, newRating);
      teamMatchCount.set(teamNum, (teamMatchCount.get(teamNum) ?? 0) + 1);

      if (!history.has(teamNum)) {
        history.set(teamNum, []);
      }
      history.get(teamNum)?.push({
        matchNumber: obs.matchNumber,
        matchType: obs.matchType,
        ordinal: ordinal(newRating),
        mu: newRating.mu,
        sigma: newRating.sigma,
        rank: i + 1,
      });
    }
  }

  // Build final ratings array
  const ratings: DriveTeamRating[] = [];
  for (const [teamNum, r] of teamRatings) {
    ratings.push({
      teamNumber: teamNum,
      teamName: teamNames.get(teamNum) ?? `Team ${teamNum}`,
      mu: r.mu,
      sigma: r.sigma,
      ordinal: ordinal(r),
      matchesRanked: teamMatchCount.get(teamNum) ?? 0,
    });
  }

  // Sort by ordinal descending (best first)
  ratings.sort((a, b) => b.ordinal - a.ordinal);

  return { ratings, history };
}
