import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from 'next-auth/jwt';

// This function can be marked `async` if using `await` inside
export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const isAuthenticated = !!token;
  
  // Define public paths that don't require authentication
  const publicPaths = ['/login', '/register'];
  
  // Check if the current path is a public path
  const isPublicPath = publicPaths.some(path => 
    request.nextUrl.pathname === path
  );
  
  // Redirect authenticated users away from auth pages
  if (isAuthenticated && isPublicPath) {
    return NextResponse.redirect(new URL('/home', request.url));
  }
  
  // Redirect unauthenticated users to login page
  if (!isAuthenticated && !isPublicPath && request.nextUrl.pathname !== '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|manifest.json|icons).*)'],
}; 