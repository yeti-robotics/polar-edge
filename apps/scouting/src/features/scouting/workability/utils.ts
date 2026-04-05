interface HasWorkabilityScores {
  avgDriverWorkability: number | null;
  avgHumanPlayerWorkability: number | null;
}

export function formatWorkabilityScore(value: number | null | undefined) {
  return value === null || value === undefined ? "—" : value.toFixed(1);
}

export function getCoverageLabel(team: HasWorkabilityScores) {
  if (team.avgDriverWorkability !== null && team.avgHumanPlayerWorkability !== null) {
    return "Full";
  }

  if (team.avgDriverWorkability !== null) {
    return "Driver only";
  }

  if (team.avgHumanPlayerWorkability !== null) {
    return "HP only";
  }

  return "None";
}
