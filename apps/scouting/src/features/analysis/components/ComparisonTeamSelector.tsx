"use client";

import { Badge } from "@repo/ui/components/badge";
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
import { Loader2, PlusIcon, XIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useTeamSearch } from "@/components/team-search/use-team-search";

type Props = {
  selectedTeams: number[];
  maxTeams?: number;
};

export function ComparisonTeamSelector({ selectedTeams, maxTeams = 5 }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const { query, setQuery, results, isSearching, clearSearch } = useTeamSearch();

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) clearSearch();
  };

  const addTeam = (teamNumber: number) => {
    if (selectedTeams.includes(teamNumber) || selectedTeams.length >= maxTeams) return;
    const params = new URLSearchParams(searchParams.toString());
    const next = [...selectedTeams, teamNumber];
    params.set("teams", next.join(","));
    setOpen(false);
    clearSearch();
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const removeTeam = (teamNumber: number) => {
    const params = new URLSearchParams(searchParams.toString());
    const next = selectedTeams.filter((n) => n !== teamNumber);
    if (next.length === 0) {
      params.delete("teams");
    } else {
      params.set("teams", next.join(","));
    }
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const atMax = selectedTeams.length >= maxTeams;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {selectedTeams.map((num) => (
        <Badge key={num} variant="secondary" className="gap-1 pl-3 pr-2 py-1 text-sm font-mono">
          {num}
          <button
            type="button"
            onClick={() => removeTeam(num)}
            className="ml-1 rounded-sm opacity-70 hover:opacity-100 focus:outline-none"
            aria-label={`Remove team ${num}`}
          >
            <XIcon className="size-3" />
          </button>
        </Badge>
      ))}

      <Popover open={open} onOpenChange={handleOpenChange}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={atMax}
            title={atMax ? `Maximum ${maxTeams} teams` : undefined}
          >
            <PlusIcon className="size-4" />
            Add team
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
                  {results.map((team) => {
                    const alreadyAdded = selectedTeams.includes(team.teamNumber);
                    return (
                      <CommandItem
                        key={team.teamNumber}
                        value={String(team.teamNumber)}
                        onSelect={() => addTeam(team.teamNumber)}
                        disabled={alreadyAdded}
                        className={alreadyAdded ? "opacity-40" : undefined}
                      >
                        <span className="font-mono">{team.teamNumber}</span>
                        <span className="text-muted-foreground"> — {team.teamName}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              ) : (
                <CommandEmpty>{query ? "No teams found." : "Type to search…"}</CommandEmpty>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {atMax && <span className="text-xs text-muted-foreground">Maximum {maxTeams} teams</span>}
    </div>
  );
}
