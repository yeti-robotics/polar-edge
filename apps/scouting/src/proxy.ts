import { getSessionCookie } from "better-auth/cookies";
import { type NextRequest, NextResponse } from "next/server";

// Only check cookie existence per Better Auth's Next.js proxy recommendation.
// Avoid DB/API calls in middleware to prevent blocking requests.
// Actual session validity and org membership are verified at the page/action level.

export function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);

  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/auto-path/:path*",
    "/forms/:path*",
    "/organization/:path*",
    "/profile/:path*",
  ],
};
