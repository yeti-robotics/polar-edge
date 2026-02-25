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
import { useRouter, usePathname, useSearchParams } from "next/navigation";



type Team = {
  teamNumber: number;
  teamName: string;
};

interface CompareTeamsButtonProps {
  teams: Team[];
}




export default function CompareTeamsButton({ teams }: CompareTeamsButtonProps) {

  const router = useRouter() 
  const searchParams = useSearchParams()
  const pathName = usePathname()

const changeTeam = (number: number) => {
  const params = new URLSearchParams(searchParams.toString())
  params.set("team1", number.toString())
  router.push(`${pathName}?${params.toString()}`)
  
}

const selectedTeam = teams.find(
  (t) => t.teamNumber === Number(searchParams.get("team1"))
);

   
  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
        <Button variant="default">
            <Scale className="mr-2 h-4 w-4" /> 
            {selectedTeam ? `Team: ${selectedTeam.teamName}` : "Compare Team"}
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
