"use client";
import { Button } from "@repo/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@repo/ui/components/dropdown-menu";
import { Scale } from "lucide-react";
import { useEffect, useState } from "react";

type Team = {
  teamNumber: number;
  teamName?: string;
};

export default function CompareTeamsButton() {
  const [teams, setTeams] = useState<Team[]>([]);

  useEffect(() => {
    let mounted = true;
    fetch("/api/teams/search")
      .then((res) => res.json())
      .then((data) => {
        if (!mounted) return;
        setTeams(Array.isArray(data) ? data : []);
      })
      .catch(() => {
        if (mounted) setTeams([]);
      });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="default">
            <Scale /> Compare Team
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuLabel>Select a Team</DropdownMenuLabel>
            {teams.length === 0 ? (
              <DropdownMenuItem disabled>No teams found</DropdownMenuItem>
            ) : (
              teams.map((team) => (
                <DropdownMenuItem key={team.teamNumber}>
                  Team {team.teamNumber}
                  {team.teamName ? ` — ${team.teamName}` : null}
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
