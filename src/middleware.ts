import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Cookie names
const IS_AUTHENTICATED_COOKIE = 'hummane_is_authenticated'
const USER_ROLE_COOKIE = 'hummane_user_role'

// Admin routes that member users should not access
const ADMIN_ROUTES = [
  '/dashboard',
  '/team',
  '/attendance',
  '/payroll',
  '/organization',
  '/jobs',
  '/applicants',
  '/settings',
  '/support',
  '/users',
  '/departments',
  '/roles',
  '/performance',
]

// Member area root
const MEMBER_ROOT = '/member'

// Auth routes (login/signup)
const AUTH_ROUTES = ['/login', '/signup']

// Public routes that don't require auth
const PUBLIC_ROUTES = ['/', ...AUTH_ROUTES]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAuthenticated = request.cookies.get(IS_AUTHENTICATED_COOKIE)?.value === 'true'
  const userRole = request.cookies.get(USER_ROLE_COOKIE)?.value

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
  // Keep role-based boundaries while still allowing deep links within each area.
  if (userRole === 'member') {
    if (ADMIN_ROUTES.some(route => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL(MEMBER_ROOT, request.url))
    }
  }

  if (userRole === 'owner') {
    if (pathname.startsWith(MEMBER_ROOT)) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

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
