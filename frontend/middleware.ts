import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Protected routes that require an authenticated session.
 * Anyone attempting to access these routes without a valid session token
 * will be redirected to the login page immediately at the edge.
 */
const PROTECTED_ROUTES = [
  '/dashboard',
  '/cases',
  '/create',
  '/jury',
  '/messages',
  '/profile',
  '/settings',
  '/reputation',
  '/notifications',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const isProtected = PROTECTED_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`)
  );

  if (isProtected) {
    const token = request.cookies.get('resolvia_token')?.value;

    if (!token || token.trim() === '') {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, sitemap.xml, robots.txt
     * - public static files (.png, .svg, .jpg, etc.)
     * - api routes
     */
    '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
