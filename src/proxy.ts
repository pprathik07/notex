import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function hasSessionCookie(request: NextRequest) {
  const cookieNames = [
    "__Secure-next-auth.session-token",
    "next-auth.session-token",
  ] as const;

  return cookieNames.some((name) => {
    if (request.cookies.get(name)?.value) {
      return true;
    }

    // NextAuth may split large session cookies into chunked values.
    return request.cookies.get(`${name}.0`)?.value != null;
  });
}

export async function proxy(request: NextRequest) {
  if (!hasSessionCookie(request)) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app", "/app/:path*", "/notes/:path*"],
};
