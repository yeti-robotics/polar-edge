import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { verifyPitPhotoViewToken } from "@/lib/server/pit-photo-token";
import { getObjectStream } from "@/lib/server/storage";

/**
 * Proxy route for pit robot photos. Ensures org-scoped access (no public CDN),
 * then streams the image from S3. Accepts either:
 * - Cookie auth (session + org): for direct browser requests.
 * - Token in query (?token=...): short-lived signed token so the Next.js image
 *   optimizer (which does not send cookies) can load and optimize the image.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const key = searchParams.get("key");
  const token = searchParams.get("token");

  if (!key || typeof key !== "string") {
    return NextResponse.json({ error: "Missing key" }, { status: 400 });
  }

  let resolvedKey = key;

  if (token) {
    const verified = verifyPitPhotoViewToken(token);
    if (!verified || verified.storageKey !== key) {
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 403 });
    }
    resolvedKey = verified.storageKey;
  } else {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const activeMember = await auth.api.getActiveMember({
      headers: await headers(),
    });
    if (!activeMember?.organizationId) {
      return NextResponse.json({ error: "No active organization" }, { status: 403 });
    }

    if (!key.startsWith(`${activeMember.organizationId}/`)) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }
  }

  const result = await getObjectStream(resolvedKey);
  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(result.body, {
    headers: {
      "Content-Type": result.contentType,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
