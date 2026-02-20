"use client";

import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/popover";
import { ArrowLeftRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

type Team = { teamNumber: number; teamName: string };

export function SelectTeam() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [teams, setTeams] = useState<Team[]>([]);
  const [lastSearchedQuery, setLastSearchedQuery] = useState("");

  const searchTeams = useCallback((q: string) => {
    if (!q.trim()) {
      setTeams([]);
      setLastSearchedQuery("");
      return;
    }
    startTransition(async () => {
      try {
        const params = new URLSearchParams({ q: q.trim() });
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

  const isSearching = Boolean(search && (search.trim() !== lastSearchedQuery || isPending));

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setSearch("");
          setTeams([]);
          setLastSearchedQuery("");
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
          className="mb-2 h-8 text-sm"
          autoFocus
        />
        <div className="max-h-64 overflow-y-auto">
          {teams.length > 0 ? (
            teams.map((team) => (
              <button
                key={team.teamNumber}
                type="button"
                className="hover:bg-accent hover:text-accent-foreground w-full whitespace-nowrap overflow-hidden text-ellipsis rounded px-2 py-1.5 text-left text-sm transition-colors"
                onClick={() => {
                  setOpen(false);
                  router.push(`/analysis/team/${team.teamNumber}`);
                }}
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
