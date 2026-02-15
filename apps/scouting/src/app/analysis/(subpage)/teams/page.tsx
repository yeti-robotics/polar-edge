import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@repo/ui/components/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@repo/ui/components/table";
import { asc, count, eq, ilike, or } from "drizzle-orm";
import Link from "next/link";
import { Suspense } from "react";
import { db } from "@/lib/database";
import { team } from "@/lib/database/schema/tables/team";
import { TeamsSearch } from "./TeamsSearch";

const ITEMS_PER_PAGE = 25;

interface TeamsPageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
  }>;
}

async function getTeamsData(page: number = 1, searchQuery?: string) {
  const offset = (page - 1) * ITEMS_PER_PAGE;

  const searchPattern = searchQuery ? `%${searchQuery}%` : null;
  const searchNum = searchQuery ? parseInt(searchQuery, 10) : null;
  const isNumericSearch = searchNum && !Number.isNaN(searchNum);

  const whereConditions = searchPattern
    ? isNumericSearch
      ? or(ilike(team.teamName, searchPattern), eq(team.teamNumber, searchNum))
      : ilike(team.teamName, searchPattern)
    : undefined;

  const teams = searchQuery
    ? await db
        .select()
        .from(team)
        .where(whereConditions)
        .orderBy(asc(team.teamNumber))
        .limit(ITEMS_PER_PAGE)
        .offset(offset)
    : await db.query.team.findMany({
        orderBy: [asc(team.teamNumber)],
        limit: ITEMS_PER_PAGE,
        offset,
      });

  const totalCountResult = searchQuery
    ? await db.select({ count: count() }).from(team).where(whereConditions)
    : await db.select({ count: count() }).from(team);

  const totalCount = totalCountResult[0]?.count ?? 0;
  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  return {
    teams,
    totalCount,
    totalPages,
    currentPage: page,
  };
}

async function TeamsTable({ page, searchQuery }: { page: number; searchQuery?: string }) {
  const { teams, totalCount, totalPages, currentPage } = await getTeamsData(page, searchQuery);

  if (teams.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center text-muted-foreground">
        {searchQuery ? `No teams found matching "${searchQuery}"` : "No teams found in database"}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32">Team Number</TableHead>
              <TableHead>Team Name</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {teams.map((teamData) => (
              <TableRow key={teamData.teamNumber} className="cursor-pointer hover:bg-muted/50">
                <TableCell>
                  <Link
                    href={`/analysis/teams/${teamData.teamNumber}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {teamData.teamNumber}
                  </Link>
                </TableCell>
                <TableCell>
                  <Link href={`/analysis/teams/${teamData.teamNumber}`} className="hover:underline">
                    {teamData.teamName || (
                      <span className="text-muted-foreground italic">No name</span>
                    )}
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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
                  <PaginationPrevious
                    href={`/analysis/teams?page=${currentPage - 1}${
                      searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ""
                    }`}
                  />
                </PaginationItem>
              )}

              {currentPage > 2 && (
                <>
                  <PaginationItem>
                    <PaginationLink
                      href={`analysis/teams?page=1${
                        searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ""
                      }`}
                    >
                      1
                    </PaginationLink>
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
                  <PaginationLink
                    href={`analysis/teams?page=${currentPage - 1}${
                      searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ""
                    }`}
                  >
                    {currentPage - 1}
                  </PaginationLink>
                </PaginationItem>
              )}

              <PaginationItem>
                <PaginationLink
                  href={`/analysis/teams?page=${currentPage}${
                    searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ""
                  }`}
                  isActive
                >
                  {currentPage}
                </PaginationLink>
              </PaginationItem>

              {currentPage < totalPages && (
                <PaginationItem>
                  <PaginationLink
                    href={`/analysis/teams?page=${currentPage + 1}${
                      searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ""
                    }`}
                  >
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
                    <PaginationLink
                      href={`/analysis/teams?page=${totalPages}${
                        searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ""
                      }`}
                    >
                      {totalPages}
                    </PaginationLink>
                  </PaginationItem>
                </>
              )}

              {currentPage < totalPages && (
                <PaginationItem>
                  <PaginationNext
                    href={`analysis/teams?page=${currentPage + 1}${
                      searchQuery ? `&search=${encodeURIComponent(searchQuery)}` : ""
                    }`}
                  />
                </PaginationItem>
              )}
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  );
}

export default async function TeamsPage({ searchParams }: TeamsPageProps) {
  const params = await searchParams;
  const page = parseInt(params.page ?? "1", 10) || 1;
  const searchQuery = params.search?.trim();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl">Teams</h1>
          <p className="text-muted-foreground mt-1">Browse all teams in the database</p>
        </div>
      </div>

      <Suspense fallback={<div className="h-10 w-full" />}>
        <TeamsSearch initialSearch={searchQuery} />
      </Suspense>

      <Suspense
        fallback={
          <div className="rounded-lg border p-8 text-center text-muted-foreground">
            Loading teams...
          </div>
        }
      >
        <TeamsTable page={page} searchQuery={searchQuery} />
      </Suspense>
    </div>
  );
}
