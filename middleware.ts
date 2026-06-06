import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { getJwtSecretKey, isSameOrigin } from "@/lib/security";

const COOKIE_NAME = "rekapuang_session";
const publicPaths = ["/login", "/register", "/forgot-password", "/reset-password"];

function applySecurityHeaders(response: NextResponse) {
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method;

  if (
    pathname.startsWith("/api/") &&
    ["POST", "PUT", "DELETE", "PATCH"].includes(method) &&
    !isSameOrigin(request)
  ) {
    return applySecurityHeaders(
      NextResponse.json({ error: "Origin tidak valid" }, { status: 403 })
    );
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  let isLoggedIn = false;

  if (token) {
    try {
      await jwtVerify(token, getJwtSecretKey(), { algorithms: ["HS256"] });
      isLoggedIn = true;
    } catch {
      isLoggedIn = false;
      if (pathname.startsWith("/dashboard")) {
        const response = NextResponse.redirect(new URL("/login", request.url));
        response.cookies.delete(COOKIE_NAME);
        return applySecurityHeaders(response);
      }
    }
  }

  if (publicPaths.includes(pathname)) {
    if (isLoggedIn) {
      return applySecurityHeaders(
        NextResponse.redirect(new URL("/dashboard", request.url))
      );
    }
    return applySecurityHeaders(NextResponse.next());
  }

  if (pathname === "/") {
    if (isLoggedIn) {
      return applySecurityHeaders(
        NextResponse.redirect(new URL("/dashboard", request.url))
      );
    }
    return applySecurityHeaders(NextResponse.next());
  }

  if (!isLoggedIn && pathname.startsWith("/dashboard")) {
    return applySecurityHeaders(NextResponse.redirect(new URL("/login", request.url)));
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/register",
    "/forgot-password",
    "/reset-password",
    "/dashboard/:path*",
    "/api/:path*",
  ],
};
