"use client";
import { Button } from "@repo/ui/components/button";
import Papa from "papaparse";

type Team = {
  teamNumber: number;
  teamName: string;
  avgAuto: number | null;
  avgTeleop: number | null;
  avgClimb: number | null;
  avgTotal: number | null;
  uptime: number | null;
  matches: number | null;
  rank: number | null;
  drivetrain: string | null;
};

type Props = {
  teams: Team[];
  eventName: string;
};

export default function ExportButton({ teams, eventName }: Props) {
  const handleExport = () => {
    const rows = teams.map((team) => ({
      "Team number": team.teamNumber ?? "N/A",
      "Team name": team.teamName ?? "N/A",
      "Avg auto points": team.avgAuto ?? 0,
      "Avg teleop points": team.avgTeleop ?? 0,
      "Avg climb points": team.avgClimb ?? 0,
      "Avg total points": team.avgTotal ?? 0,
      "Uptime %": team.uptime ?? "N/A",
      "Matches scouted": team.matches ?? 0,
      "Overall rank": team.rank ?? "N/A",
      "Drivetrain type": team.drivetrain ?? "N/A",
    }));

    const csv = Papa.unparse(rows);

    const date = new Date().toISOString().split("T")[0];
    const filename = `team-data-${eventName}-${date}.csv`;

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative">
      <Button className="absolute -top-16 right-0" onClick={handleExport}>
        Export CSV
      </Button>
    </div>
  );
}
