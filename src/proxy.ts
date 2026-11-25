import { NextResponse, type NextRequest } from "next/server";
import { looksLikeSessionToken, SESSION_COOKIE } from "@/lib/session-cookie";

const PUBLIC_PATHS = ["/login", "/signup", "/forgot", "/invite", "/join"];

/**
 * Optimistic check: visitors without a session cookie are sent to /login.
 * The session itself is verified against the database by every page,
 * server action and route handler (see src/lib/auth.ts).
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return NextResponse.next();
  if (!looksLikeSessionToken(request.cookies.get(SESSION_COOKIE)?.value)) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = pathname === "/" ? "" : `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Skip API routes, Next internals and static files.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:png|jpg|jpeg|svg|webp|ico|txt)$).*)"],
};
