import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request });
  const isAuthenticated = !!token;
  const isAuthPage = request.nextUrl.pathname.startsWith("/login");
  const isRootPage = request.nextUrl.pathname === "/";

  // Redirect authenticated users away from auth pages
  if (isAuthenticated && isAuthPage) {
    return NextResponse.redirect(new URL("/home", request.url));
  }

  // Allow access to auth pages and API routes
  if (isAuthPage || request.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login page
  if (!isAuthenticated && !isRootPage) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}; 