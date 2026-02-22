"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { TeamSearch } from "@/components/team-search/team-search";
import { routes } from "@/lib/routes";

export function TeamSearchWrapper() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchQuery = searchParams.get("search") ?? undefined;

  const handleFilter = useCallback(
    (query: string) => {
      const params = new URLSearchParams();
      if (query.trim()) params.set("search", query.trim());
      const qs = params.toString();
      router.push(`${routes.analysis.teams}${qs ? `?${qs}` : ""}`);
    },
    [router]
  );

  return (
    <TeamSearch
      defaultQuery={searchQuery}
      onFilter={handleFilter}
      placeholder="Search by team number or name…"
    />
  );
}
