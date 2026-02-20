"use client";
import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { Popover, PopoverContent, PopoverTrigger } from "@repo/ui/components/popover";
import { ArrowLeftRight } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SelectTeam({
  teams,
}: {
  teams: Array<{ teamNumber: number; teamName: string }>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const filtered = teams.filter(
    (t) =>
      t.teamNumber.toString().includes(search) ||
      t.teamName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setSearch("");
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
          {filtered.length === 0 ? (
            <p className="text-muted-foreground py-4 text-center text-sm">No teams found.</p>
          ) : (
            filtered.map((team) => (
              <button
                key={team.teamNumber}
                type="button"
                className="hover:bg-accent hover:text-accent-foreground w-full rounded px-2 py-1.5 text-left text-sm transition-colors"
                onClick={() => {
                  setOpen(false);
                  router.push(`/analysis/team/${team.teamNumber}`);
                }}
              >
                <span className="font-mono">{team.teamNumber}</span>
                <span className="text-muted-foreground"> — {team.teamName}</span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
