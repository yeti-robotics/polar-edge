import { NextResponse } from "next/server";
import { db } from "@/lib/database";
import { climb } from "@/lib/database/schema/tables";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("standFormId");
  if (!id) return NextResponse.json({ error: "Missing standFormId" }, { status: 400 });

  // require admin
  try {
    const { requireAdminMember } = await import("@/lib/server/auth/require-member");
    await requireAdminMember();
  } catch (_) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rows = await db
      .select()
      .from(climb)
      .where(climb.standFormId.eq(id))
      .orderBy(climb.createdAt);
    return NextResponse.json({ data: rows });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Failed query: ${message}` }, { status: 500 });
  }
}
