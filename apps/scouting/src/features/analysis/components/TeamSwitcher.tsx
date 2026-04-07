"use client";

import { Button } from "@repo/ui/components/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/ui/components/command";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/popover";
import { ArrowLeftRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTeamSearch } from "@/components/team-search/use-team-search";
import { routes } from "@/lib/routes";

export function SelectTeam() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { query, setQuery, results, isSearching, clearSearch } = useTeamSearch();

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) clearSearch();
  };

  const selectTeam = (teamNumber: number) => {
    setOpen(false);
    clearSearch();
    router.push(routes.analysis.team(teamNumber));
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <ArrowLeftRight /> Switch Team
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search teams…"
            value={query}
            onValueChange={setQuery}
            autoFocus
          />
          <CommandList>
            {isSearching ? (
              <CommandItem disabled value="__searching__" className="justify-center py-4">
                <Loader2 className="size-4 animate-spin" />
                <span className="text-muted-foreground ml-2">Searching…</span>
              </CommandItem>
            ) : results.length > 0 ? (
              <CommandGroup>
                {results.map((team) => (
                  <CommandItem
                    key={team.teamNumber}
                    value={String(team.teamNumber)}
                    onSelect={() => selectTeam(team.teamNumber)}
                  >
                    <span className="font-mono">{team.teamNumber}</span>
                    <span className="text-muted-foreground"> — {team.teamName}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            ) : (
              <CommandEmpty>{query ? "No teams found." : "Type to search…"}</CommandEmpty>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
