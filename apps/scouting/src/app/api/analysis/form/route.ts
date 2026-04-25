import { NextResponse } from "next/server";
import { getFormSubmissionById } from "@/features/analysis/queries";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  const type = url.searchParams.get("type") as "stand" | "pit" | null;
  if (!id || !type) return NextResponse.json({ error: "Missing id or type" }, { status: 400 });

  try {
    const payload = await getFormSubmissionById(id, type);
    if (!payload) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({ data: payload });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message ?? "Server error" }, { status: 500 });
  }
}
