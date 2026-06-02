import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const COOKIE_NAME = "rekapuang_session";
const publicPaths = ["/login", "/register", "/forgot-password", "/reset-password"];

function getSecret() {
  return new TextEncoder().encode(
    process.env.JWT_SECRET || "ganti-dengan-secret-panjang-di-production"
  );
}

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

  // Basic CSRF protection for API mutating routes
  if (pathname.startsWith("/api/") && ["POST", "PUT", "DELETE", "PATCH"].includes(method)) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    
    // In local dev, origin might be missing. If it exists, ensure it matches host.
    if (origin && host) {
      const originUrl = new URL(origin);
      if (originUrl.host !== host) {
        return applySecurityHeaders(
          NextResponse.json({ error: "Invalid CSRF Origin" }, { status: 403 })
        );
      }
    }
  }

  const token = request.cookies.get(COOKIE_NAME)?.value;
  let isLoggedIn = false;

  if (token) {
    try {
      await jwtVerify(token, getSecret(), { algorithms: ["HS256"] });
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
