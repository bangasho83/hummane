import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Cookie names
const IS_AUTHENTICATED_COOKIE = 'hummane_is_authenticated'

// Auth routes (login/signup)
const AUTH_ROUTES = ['/login', '/signup']

// Public routes that don't require auth
const PUBLIC_ROUTES = ['/', ...AUTH_ROUTES]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAuthenticated = request.cookies.get(IS_AUTHENTICATED_COOKIE)?.value === 'true'

  // ===== UNAUTHENTICATED USERS =====
  if (!isAuthenticated) {
    // Allow public routes
    if (PUBLIC_ROUTES.some(route => pathname === route)) {
      return NextResponse.next()
    }
    // Redirect to login for all other routes
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ===== AUTHENTICATED USERS =====
  // Allow direct links and deep links to resolve without middleware rerouting.
  // Route-level pages/components can still enforce finer-grained behavior.
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)',
  ],
}
