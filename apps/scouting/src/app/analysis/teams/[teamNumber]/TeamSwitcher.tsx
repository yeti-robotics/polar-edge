"use client";

import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/popover";
import { ArrowLeftRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { routes } from "@/lib/routes";

type Team = { teamNumber: number; teamName: string };

export function SelectTeam() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [lastSearchedQuery, setLastSearchedQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const listRef = useRef<HTMLDivElement>(null);

  const searchTeams = useCallback((q: string) => {
    startTransition(async () => {
      try {
        const params = q.trim() ? new URLSearchParams({ q: q.trim() }) : new URLSearchParams();
        const res = await fetch(`/api/teams/search?${params}`, {
          cache: "force-cache",
          headers: { Accept: "application/json" },
        });
        const data = (await res.json()) as Team[];
        const result = Array.isArray(data) ? data : [];
        setTeams(result);
        setLastSearchedQuery(q.trim());
      } catch {
        setTeams([]);
        setLastSearchedQuery(q.trim());
      }
    });
  }, []);

  useEffect(() => {
    const t = setTimeout(() => searchTeams(search), 100);
    return () => clearTimeout(t);
  }, [search, searchTeams]);

  useEffect(() => {
    setHighlightedIndex(-1);
  }, [teams]);

  useEffect(() => {
    if (highlightedIndex >= 0 && listRef.current) {
      const options = listRef.current.querySelectorAll("[data-team-option]");
      options[highlightedIndex]?.scrollIntoView({ block: "nearest" });
    }
  }, [highlightedIndex]);

  const isSearching = Boolean(search && (search.trim() !== lastSearchedQuery || isPending));

  const highlightedTeam = teams[highlightedIndex];
  const activeDescendant =
    highlightedIndex >= 0 && highlightedTeam
      ? `team-option-${highlightedTeam.teamNumber}`
      : undefined;

  const selectTeam = useCallback(
    (team: Team) => {
      setOpen(false);
      router.push(routes.analysis.team(team.teamNumber));
    },
    [router]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (teams.length === 0) {
        if (e.key === "Escape") setOpen(false);
        return;
      }
      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          setHighlightedIndex((i) => (i < teams.length - 1 ? i + 1 : 0));
          break;
        case "ArrowUp":
          e.preventDefault();
          setHighlightedIndex((i) => (i <= 0 ? teams.length - 1 : i - 1));
          break;
        case "Enter": {
          e.preventDefault();
          const toSelect = highlightedIndex >= 0 ? teams[highlightedIndex] : teams[0];
          if (toSelect) selectTeam(toSelect);
          break;
        }
        case "Escape":
          e.preventDefault();
          setOpen(false);
          break;
      }
    },
    [teams, highlightedIndex, selectTeam]
  );

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setSearch("");
          setTeams([]);
          setLastSearchedQuery("");
          setHighlightedIndex(-1);
        }
      }}
    >
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="mt-3">
          <ArrowLeftRight /> Switch Team
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-2" align="start">
        <Input
          placeholder="Search teams…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          className="mb-2 h-8 text-sm"
          autoFocus
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls="team-switcher-listbox"
          aria-activedescendant={activeDescendant}
        />
        <div
          ref={listRef}
          id="team-switcher-listbox"
          role="listbox"
          aria-label="Teams"
          className="max-h-64 overflow-y-auto"
        >
          {teams.length > 0 ? (
            teams.map((team, index) => (
              <button
                key={team.teamNumber}
                id={`team-option-${team.teamNumber}`}
                type="button"
                data-team-option
                role="option"
                aria-selected={index === highlightedIndex}
                className={`hover:bg-accent hover:text-accent-foreground w-full whitespace-nowrap overflow-hidden text-ellipsis rounded px-2 py-1.5 text-left text-sm transition-colors ${index === highlightedIndex ? "bg-accent text-accent-foreground" : ""}`}
                onClick={() => selectTeam(team)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <span className="font-mono">{team.teamNumber}</span>
                <span className="text-muted-foreground"> — {team.teamName}</span>
              </button>
            ))
          ) : isSearching ? (
            <p className="text-muted-foreground flex items-center justify-center gap-2 py-4 text-sm">
              <Loader2 className="size-4 animate-spin" /> Searching…
            </p>
          ) : (
            <p className="text-muted-foreground py-4 text-center text-sm">
              {search ? "No teams found." : "Type to search…"}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
