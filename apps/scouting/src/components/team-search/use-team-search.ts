"use client";

import { useCallback, useRef, useState, useTransition } from "react";
import type { TeamSearchResult } from "@/app/analysis/teams/[teamNumber]/actions";

export function useTeamSearch({ initialQuery = "", debounceMs = 100 } = {}) {
  const [query, setQueryState] = useState(initialQuery);
  const [results, setResults] = useState<TeamSearchResult[]>([]);
  // Initialize lastFetched to initialQuery so isSearching stays false on mount
  const [lastFetched, setLastFetched] = useState(initialQuery);
  const [hasFetched, setHasFetched] = useState(false);
  const [isPending, startTransition] = useTransition();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchResults = useCallback((q: string) => {
    startTransition(async () => {
      try {
        const params = q.trim() ? new URLSearchParams({ q: q.trim() }) : new URLSearchParams();
        const res = await fetch(`/api/teams/search?${params}`, {
          cache: "force-cache",
          headers: { Accept: "application/json" },
        });
        const data = (await res.json()) as TeamSearchResult[];
        setResults(Array.isArray(data) ? data : []);
        setLastFetched(q.trim());
        setHasFetched(true);
      } catch {
        setResults([]);
        setLastFetched(q.trim());
        setHasFetched(true);
      }
    });
  }, []);

  const setQuery = useCallback(
    (q: string) => {
      setQueryState(q);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => fetchResults(q), debounceMs);
    },
    [fetchResults, debounceMs]
  );

  const clearSearch = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setQueryState("");
    setResults([]);
    setLastFetched("");
    setHasFetched(false);
  }, []);

  const isSearching = Boolean(query && (query.trim() !== lastFetched || isPending));

  return { query, setQuery, results, isSearching, isPending, hasFetched, clearSearch };
}
