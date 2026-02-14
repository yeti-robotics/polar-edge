// this is going to have merge issues becasue the other branch has a lot of changes to the same file, but this is the only way to do it without breaking the other branch
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
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

// used claude to help make this function, to update the the URL
type Team = {
  id: string;
  teamNumber: string;
  teamName: string;
};

export function DropdownMenuCheckboxesIcons() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const team1 = searchParams.get("team1");
  const team2 = searchParams.get("team2");
  const team3 = searchParams.get("team3");

  const teamUpdate = (paramName: string, teamNumber: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(paramName, teamNumber);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="sticky top-0 z-10">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="default" className="w-32">
            Team Select
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuGroup>
            <DropdownMenuLabel className="font-bold">
              {team1 && <p>Selected Team: {team1}</p>}
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={() => teamUpdate("1234", "team1")}>
              {team1 && <p> Team: {team1}</p>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => teamUpdate("5678", "team2")}>
              {team2 && <p> Team: {team2}</p>}
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => teamUpdate("9012", "team3")}>
              {team3 && <p>Team: {team3}</p>}
            </DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

function TeamSelection() {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-4xl font-mono">Comparison Page </h1>
      <div className="w-full">
        <DropdownMenuCheckboxesIcons />
      </div>
    </div>
  );
}

export default function ComparisonPage() {
  return (
    <div className="p-4">
      <TeamSelection />
    </div>
  );
}
