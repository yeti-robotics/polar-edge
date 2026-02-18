import { type NextRequest, NextResponse } from "next/server";

// Only check cookie existence per Better Auth's Next.js proxy recommendation.
// Avoid DB/API calls in middleware to prevent blocking requests.
// Actual session validity and org membership are verified at the page/action level.
const SESSION_COOKIE = "better-auth.session_token";

export function proxy(request: NextRequest) {
  const sessionCookie = request.cookies.get(SESSION_COOKIE);

  if (!sessionCookie?.value) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/analysis/:path*",
    "/auto-path/:path*",
    "/forms/:path*",
    "/organization/:path*",
    "/profile/:path*",
  ],
};
