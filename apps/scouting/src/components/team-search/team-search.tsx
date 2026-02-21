"use client";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@repo/ui/components/command";
import { ChevronRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";
import type { TeamSearchResult } from "@/app/analysis/teams/[teamNumber]/actions";
import { routes } from "@/lib/routes";
import { useTeamSearch } from "./use-team-search";

interface TeamSearchProps {
  defaultQuery?: string;
  onSelect?: (team: TeamSearchResult) => void;
  onFilter?: (query: string) => void;
  placeholder?: string;
  className?: string;
}

export function TeamSearch({
  defaultQuery,
  onSelect,
  onFilter,
  placeholder = "Search by team number or name…",
  className,
}: TeamSearchProps) {
  const router = useRouter();
  const { query, setQuery, results, isSearching, hasFetched } = useTeamSearch({
    initialQuery: defaultQuery,
  });

  const handleSelect = useCallback(
    (team: TeamSearchResult) => {
      if (onSelect) {
        onSelect(team);
      } else {
        router.push(routes.analysis.team(team.teamNumber));
      }
    },
    [onSelect, router]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Enter" && !e.defaultPrevented) {
        // cmdk did NOT handle this Enter (no item selected via keyboard)
        onFilter?.(query);
      }
    },
    [query, onFilter]
  );

  // Show the dropdown once the user has triggered at least one search
  const showList = query !== "" && hasFetched;

  return (
    <div className={`relative ${className ?? ""}`}>
      <Command shouldFilter={false} className="rounded-lg border" onKeyDown={handleKeyDown}>
        <CommandInput value={query} onValueChange={setQuery} placeholder={placeholder} />
        {showList && (
          <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border bg-popover shadow-md">
            {/* Keep previous results visible while fetching — no spinner replacing the list */}
            <CommandList className="max-h-72">
              {results.length > 0 ? (
                <CommandGroup>
                  {results.map((team) => (
                    <CommandItem
                      key={team.teamNumber}
                      value={String(team.teamNumber)}
                      onSelect={() => handleSelect(team)}
                      className="group flex items-center justify-between"
                    >
                      <span>
                        <span className="font-mono font-semibold tabular-nums">
                          {team.teamNumber}
                        </span>
                        {team.teamName && (
                          <span className="text-muted-foreground ml-2">{team.teamName}</span>
                        )}
                      </span>
                      <ChevronRight className="size-4 text-muted-foreground opacity-0 transition-opacity group-data-[selected=true]:opacity-100" />
                    </CommandItem>
                  ))}
                </CommandGroup>
              ) : (
                <CommandEmpty>No teams found.</CommandEmpty>
              )}
            </CommandList>
          </div>
        )}
      </Command>
      {/* Spinner outside Command to avoid overflow-hidden clipping */}
      {isSearching && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10 pointer-events-none">
          <Loader2 className="size-4 animate-spin text-muted-foreground" />
        </div>
      )}
    </div>
  );
}
