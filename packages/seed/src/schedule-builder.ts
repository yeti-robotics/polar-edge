import { gameConfig } from "./game-config";
import type { SimulatedMatch, TeamProfile } from "./types";

/** Event definition produced by district planning. */
export type PlannedEvent = {
  name: string;
  eventCode: string;
  teamNumbers: number[];
  matchesPerTeam: number;
  isDcmp: boolean;
};

/**
 * Plan a realistic FRC district season.
 *
 * - Calculates the number of district events needed so each team attends exactly 2.
 * - Assigns teams to events with balanced sizes (26-32 per event).
 * - Selects DCMP attendees biased toward higher-skill teams.
 */
export function planDistrict(profiles: TeamProfile[]): PlannedEvent[] {
  const { district, teamCount } = gameConfig;
  const [minTeams, maxTeams] = district.teamsPerEvent;
  const avgTeams = (minTeams + maxTeams) / 2;

  // Each team attends 2 events → total team-slots = teamCount * 2
  // Events needed = total slots / avg teams per event
  const numEvents = Math.round((teamCount * 2) / avgTeams);

  // Determine team count per event (random within range, then adjust to hit total)
  const eventSizes: number[] = [];
  let totalSlots = 0;
  for (let i = 0; i < numEvents; i++) {
    const size = Math.floor(Math.random() * (maxTeams - minTeams + 1)) + minTeams;
    eventSizes.push(size);
    totalSlots += size;
  }

  // Adjust to match exactly teamCount * 2 total slots
  const targetSlots = teamCount * 2;
  while (totalSlots !== targetSlots) {
    const idx = Math.floor(Math.random() * numEvents);
    const currentSize = eventSizes[idx] ?? 0;
    if (totalSlots < targetSlots && currentSize < maxTeams) {
      eventSizes[idx] = currentSize + 1;
      totalSlots++;
    } else if (totalSlots > targetSlots && currentSize > minTeams) {
      eventSizes[idx] = currentSize - 1;
      totalSlots--;
    }
  }

  // Assign each team to exactly 2 events
  // Build a pool: each team appears twice, shuffle, then greedily assign
  const teamAssignments = new Map<number, number[]>(); // teamNumber → event indices
  for (const p of profiles) {
    teamAssignments.set(p.teamNumber, []);
  }

  const teamPool: number[] = [];
  for (const p of profiles) {
    teamPool.push(p.teamNumber, p.teamNumber);
  }
  shuffle(teamPool);

  const eventTeams: number[][] = eventSizes.map(() => []);
  const eventCapacity = [...eventSizes];

  for (const teamNum of teamPool) {
    const assigned = teamAssignments.get(teamNum);
    if (!assigned) continue;
    if (assigned.length >= 2) continue;

    // Find an event with capacity that this team isn't already in
    let bestEvent = -1;
    let bestCapacity = 0;
    for (let i = 0; i < numEvents; i++) {
      const cap = eventCapacity[i] ?? 0;
      if (cap <= 0) continue;
      if (eventTeams[i]?.includes(teamNum)) continue;
      if (cap > bestCapacity) {
        bestCapacity = cap;
        bestEvent = i;
      }
    }

    if (bestEvent >= 0) {
      eventTeams[bestEvent]?.push(teamNum);
      eventCapacity[bestEvent] = (eventCapacity[bestEvent] ?? 0) - 1;
      assigned.push(bestEvent);
    }
  }

  // Build district events
  const events: PlannedEvent[] = eventTeams.map((teams, i) => ({
    name: `District Event ${i + 1}`,
    eventCode: `2026dist${String(i + 1).padStart(2, "0")}`,
    teamNumbers: teams,
    matchesPerTeam: district.matchesPerTeam,
    isDcmp: false,
  }));

  // Select DCMP teams: biased toward higher skill
  const dcmpTeams = selectDcmpTeams(profiles, district.dcmp.teamCount, district.dcmp.skillBias);

  events.push({
    name: "District Championship",
    eventCode: "2026dcmp",
    teamNumbers: dcmpTeams,
    matchesPerTeam: district.dcmp.matchesPerTeam,
    isDcmp: true,
  });

  return events;
}

/**
 * Select DCMP attendees biased toward higher-skill teams.
 *
 * Each team gets a "selection score" = skill * bias + random * (1 - bias).
 * Top N by selection score advance.
 */
function selectDcmpTeams(profiles: TeamProfile[], count: number, bias: number): number[] {
  const scored = profiles.map((p) => ({
    teamNumber: p.teamNumber,
    score: p.skill * bias + Math.random() * (1 - bias),
  }));

  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, count).map((s) => s.teamNumber);
}

/**
 * Build a qualification match schedule for a set of teams.
 */
export function buildSchedule(teamNumbers: number[], matchesPerTeam: number): SimulatedMatch[] {
  const teamsPerMatch = 6;
  const totalSlots = teamNumbers.length * matchesPerTeam;
  const matchCount = Math.ceil(totalSlots / teamsPerMatch);

  const pool: number[] = [];
  for (const team of teamNumbers) {
    for (let i = 0; i < matchesPerTeam; i++) {
      pool.push(team);
    }
  }

  shuffle(pool);

  const matches: SimulatedMatch[] = [];

  for (let m = 0; m < matchCount; m++) {
    const start = m * teamsPerMatch;
    const matchTeams = pool.slice(start, start + teamsPerMatch);

    if (matchTeams.length < teamsPerMatch) break;

    // Deduplicate within a match
    const seen = new Set<number>();
    for (let i = 0; i < matchTeams.length; i++) {
      const t = matchTeams[i] ?? 0;
      if (seen.has(t)) {
        let swapped = false;
        for (let j = start + teamsPerMatch; j < pool.length; j++) {
          if (!seen.has(pool[j] ?? 0)) {
            [matchTeams[i], pool[j]] = [pool[j] ?? 0, matchTeams[i] ?? 0];
            swapped = true;
            break;
          }
        }
        if (!swapped) {
          const candidates = teamNumbers.filter((tn) => !seen.has(tn));
          if (candidates.length > 0) {
            matchTeams[i] = candidates[Math.floor(Math.random() * candidates.length)] ?? 0;
          }
        }
      }
      seen.add(matchTeams[i] ?? 0);
    }

    const red = matchTeams.slice(0, 3);
    const blue = matchTeams.slice(3, 6);

    matches.push({
      matchNumber: m + 1,
      matchType: "qm",
      red: red.map((teamNumber, i) => ({ teamNumber, position: i + 1 })),
      blue: blue.map((teamNumber, i) => ({ teamNumber, position: i + 1 })),
    });
  }

  return matches;
}

function shuffle<T>(arr: T[]): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j] as T, arr[i] as T];
  }
}
