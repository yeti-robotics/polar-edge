import { cacheLife, cacheTag } from "next/cache";
import { NextRequest, NextResponse } from "next/server";
import { searchTeams } from "@/features/analysis/actions";

async function cachedSearchTeams(q: string) {
  "use cache";
  cacheLife("hours");
  cacheTag("teams-search");
  return searchTeams(q);
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const teams = await cachedSearchTeams(q);
  return NextResponse.json(teams);
}
