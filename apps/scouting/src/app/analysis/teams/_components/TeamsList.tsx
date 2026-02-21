import { Badge } from "@repo/ui/components/badge";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@repo/ui/components/pagination";
import { asc, count, eq, ilike, or } from "drizzle-orm";
import { ChevronRight, SearchX } from "lucide-react";
import { cacheLife, cacheTag } from "next/cache";
import Link from "next/link";
import { db } from "@/lib/database";
import { team } from "@/lib/database/schema/tables/team";
import { cacheTags } from "@/lib/cache";
import { routes } from "@/lib/routes";

const ITEMS_PER_PAGE = 25;

async function getTeamsData(page: number = 1, searchQuery?: string) {
  "use cache";
  cacheLife("hours");
  cacheTag(cacheTags.teamsList);

  const offset = (page - 1) * ITEMS_PER_PAGE;

  const searchPattern = searchQuery ? `%${searchQuery}%` : null;
  const searchNum = searchQuery ? parseInt(searchQuery, 10) : null;
  const isNumericSearch = searchNum && !Number.isNaN(searchNum);

  const whereConditions = searchPattern
    ? isNumericSearch
      ? or(ilike(team.teamName, searchPattern), eq(team.teamNumber, searchNum))
      : ilike(team.teamName, searchPattern)
    : undefined;

  const [teams, totalCountResult] = await Promise.all([
    searchQuery
      ? db
          .select()
          .from(team)
          .where(whereConditions)
          .orderBy(asc(team.teamNumber))
          .limit(ITEMS_PER_PAGE)
          .offset(offset)
      : db.query.team.findMany({
          orderBy: [asc(team.teamNumber)],
          limit: ITEMS_PER_PAGE,
          offset,
        }),
    searchQuery
      ? db.select({ count: count() }).from(team).where(whereConditions)
      : db.select({ count: count() }).from(team),
  ]);

  const totalCount = totalCountResult[0]?.count ?? 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return { teams, totalCount, totalPages, currentPage: page };
}

interface TeamsListProps {
  searchParams: Promise<{ page?: string; search?: string }>;
}

export async function TeamsList({ searchParams }: TeamsListProps) {
  const params = await searchParams;
  const page = parseInt(params.page ?? "1", 10) || 1;
  const searchQuery = params.search?.trim();

  const { teams, totalCount, totalPages, currentPage } = await getTeamsData(page, searchQuery);

  const buildUrl = (p: number, q?: string) => {
    const urlParams = new URLSearchParams();
    if (p > 1) urlParams.set("page", String(p));
    if (q) urlParams.set("search", q);
    const qs = urlParams.toString();
    return `${routes.analysis.teams}${qs ? `?${qs}` : ""}`;
  };

  if (teams.length === 0) {
    return (
      <div className="rounded-lg border p-12 flex flex-col items-center gap-4 text-center">
        <SearchX className="size-10 text-muted-foreground/50" />
        <div>
          <p className="font-medium">No teams found</p>
          <p className="text-sm text-muted-foreground mt-1">
            {searchQuery ? `No teams matched "${searchQuery}"` : "No teams found in database"}
          </p>
        </div>
        {searchQuery && (
          <Link
            href={routes.analysis.teams}
            className="text-sm text-primary underline-offset-4 hover:underline"
          >
            Clear search
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {searchQuery ? `Results for "${searchQuery}"` : "All teams"}
        </span>
        <Badge variant="outline" className="font-mono text-xs">
          {totalCount}
        </Badge>
      </div>

      <div className="rounded-lg border divide-y overflow-hidden">
        {teams.map((teamData) => (
          <Link
            key={teamData.teamNumber}
            href={routes.analysis.team(teamData.teamNumber)}
            className="flex items-center gap-4 px-4 py-3 hover:bg-muted/50 transition-colors group"
          >
            <span className="font-mono tabular-nums font-semibold text-sm w-14 shrink-0">
              {teamData.teamNumber}
            </span>
            <span className="flex-1 text-sm truncate">
              {teamData.teamName || <span className="text-muted-foreground italic">—</span>}
            </span>
            <ChevronRight className="size-4 text-muted-foreground shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
          </Link>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-center text-sm text-muted-foreground sm:text-left">
            Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
            {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} teams
          </div>
          <Pagination className="w-full sm:w-auto">
            <PaginationContent>
              {currentPage > 1 && (
                <PaginationItem>
                  <PaginationPrevious href={buildUrl(currentPage - 1, searchQuery)} />
                </PaginationItem>
              )}

              {currentPage > 2 && (
                <>
                  <PaginationItem>
                    <PaginationLink href={buildUrl(1, searchQuery)}>1</PaginationLink>
                  </PaginationItem>
                  {currentPage > 3 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                </>
              )}

              {currentPage > 1 && (
                <PaginationItem>
                  <PaginationLink href={buildUrl(currentPage - 1, searchQuery)}>
                    {currentPage - 1}
                  </PaginationLink>
                </PaginationItem>
              )}

              <PaginationItem>
                <PaginationLink href={buildUrl(currentPage, searchQuery)} isActive>
                  {currentPage}
                </PaginationLink>
              </PaginationItem>

              {currentPage < totalPages && (
                <PaginationItem>
                  <PaginationLink href={buildUrl(currentPage + 1, searchQuery)}>
                    {currentPage + 1}
                  </PaginationLink>
                </PaginationItem>
              )}

              {currentPage < totalPages - 1 && (
                <>
                  {currentPage < totalPages - 2 && (
                    <PaginationItem>
                      <PaginationEllipsis />
                    </PaginationItem>
                  )}
                  <PaginationItem>
                    <PaginationLink href={buildUrl(totalPages, searchQuery)}>
                      {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                </>
              )}

              {currentPage < totalPages && (
                <PaginationItem>
                  <PaginationNext href={buildUrl(currentPage + 1, searchQuery)} />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}
