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
import { usePathname, useRouter, useSearchParams } from "next/navigation";



type Team = {
  teamNumber: number;
  teamName: string;
};

interface CompareTeamsButtonProps {
  teams: Team[];
  teamParam: "team1" | "team2";
  label: string;
  variant: "default" | "outline";
}




export default function CompareTeamsButton({
  teams,
  teamParam,
  label,
  variant,
}: CompareTeamsButtonProps) {

  const router = useRouter() 
  const searchParams = useSearchParams()
  const pathName = usePathname()

const changeTeam = (number: number) => {
  const params = new URLSearchParams(searchParams.toString())
  params.set(teamParam, number.toString())
  router.push(`${pathName}?${params.toString()}`)
  
}

const selectedTeam = teams.find(
  (t) => t.teamNumber === Number(searchParams.get(teamParam))
);

   
  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
        <Button variant={variant}>
            <Scale className="mr-2 h-4 w-4" /> 
            {selectedTeam ? `${label}: ${selectedTeam.teamName}` : label}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
        <DropdownMenuGroup>
            {teams.length > 0 ? (
              teams.map((team) => (
                <DropdownMenuItem
                  key={team.teamNumber}
                  onSelect={() => changeTeam(team.teamNumber)}
                >
                  {team.teamName} ({team.teamNumber})
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled>No teams found</DropdownMenuItem>
            )}
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}



