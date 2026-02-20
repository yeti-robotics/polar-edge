import { cacheLife, cacheTag } from "next/cache";
import { NextResponse } from "next/server";
import { searchTeams } from "@/app/analysis/team/[teamNumber]/actions";

export async function GET(request: Request) {
  "use cache";
  cacheLife("hours");
  cacheTag("teams-search");

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  const teams = await searchTeams(q);

  const response = NextResponse.json(teams);
  response.headers.set("Cache-Control", "public, max-age=60, stale-while-revalidate=300");
  return response;
}
