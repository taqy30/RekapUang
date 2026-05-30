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
        return NextResponse.json({ error: "Invalid CSRF Origin" }, { status: 403 });
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
    }
  }

  if (publicPaths.includes(pathname)) {
    if (isLoggedIn) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return NextResponse.next();
  }

  if (pathname === "/") {
    return NextResponse.redirect(
      new URL(isLoggedIn ? "/dashboard" : "/login", request.url)
    );
  }

  if (!isLoggedIn && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/", "/login", "/register", "/forgot-password", "/reset-password", "/dashboard/:path*", "/api/:path*"],
};
