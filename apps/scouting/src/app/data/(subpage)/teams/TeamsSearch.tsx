"use client";

import { Button } from "@repo/ui/components/button";
import { Input } from "@repo/ui/components/input";
import { SearchIcon } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useTransition } from "react";

interface TeamsSearchProps {
  initialSearch?: string;
}

export function TeamsSearch({ initialSearch }: TeamsSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const timeoutRef = useRef<NodeJS.Timeout>();

  const handleSearch = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value.trim()) {
      params.set("search", value.trim());
      params.delete("page"); // Reset to page 1 when searching
    } else {
      params.delete("search");
      params.delete("page");
    }

    startTransition(() => {
      router.push(`/data/teams?${params.toString()}`);
    });
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search by team number or name..."
          defaultValue={initialSearch}
          className="pl-9"
          onChange={(e) => {
            const value = e.target.value;
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }
            timeoutRef.current = setTimeout(() => {
              handleSearch(value);
            }, 300);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
              }
              handleSearch(e.currentTarget.value);
            }
          }}
        />
      </div>
      {initialSearch && (
        <Button
          variant="outline"
          onClick={() => {
            if (timeoutRef.current) {
              clearTimeout(timeoutRef.current);
            }
            handleSearch("");
          }}
          disabled={isPending}
        >
          Clear
        </Button>
      )}
    </div>
  );
}
