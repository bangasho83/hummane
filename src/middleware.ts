import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Cookie names
const USER_ROLE_COOKIE = 'hummane_user_role'
const HAS_COMPANY_COOKIE = 'hummane_has_company'
const IS_AUTHENTICATED_COOKIE = 'hummane_is_authenticated'

// Admin routes that member users should NOT access
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

// Member routes
const MEMBER_ROUTES = ['/member']

// Auth routes (login/signup)
const AUTH_ROUTES = ['/login', '/signup']

// Public routes that don't require auth
const PUBLIC_ROUTES = ['/', ...AUTH_ROUTES]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAuthenticated = request.cookies.get(IS_AUTHENTICATED_COOKIE)?.value === 'true'
  const hasCompany = request.cookies.get(HAS_COMPANY_COOKIE)?.value === 'true'
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

  // If authenticated user visits login/signup, redirect them appropriately
  if (AUTH_ROUTES.some(route => pathname === route)) {
    if (!hasCompany) {
      return NextResponse.redirect(new URL('/company-setup', request.url))
    }
    if (userRole === 'member') {
      return NextResponse.redirect(new URL('/member', request.url))
    }
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // If user has no company, they must go to company-setup
  if (!hasCompany) {
    if (pathname.startsWith('/company-setup')) {
      return NextResponse.next()
    }
    // Redirect to company-setup for all other routes
    return NextResponse.redirect(new URL('/company-setup', request.url))
  }

  // ===== AUTHENTICATED USERS WITH COMPANY =====

  // Allow company-setup (in case they want to view it)
  if (pathname.startsWith('/company-setup')) {
    // If they already have a company, redirect to appropriate dashboard
    if (userRole === 'member') {
      return NextResponse.redirect(new URL('/member', request.url))
    }
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Handle member users
  if (userRole === 'member') {
    // If member is trying to access admin routes, redirect to /member
    if (ADMIN_ROUTES.some(route => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL('/member', request.url))
    }
    // Allow member routes
    if (MEMBER_ROUTES.some(route => pathname.startsWith(route))) {
      return NextResponse.next()
    }
  }

  // Handle owner users
  if (userRole === 'owner') {
    // If owner is trying to access member routes, redirect to /dashboard
    if (MEMBER_ROUTES.some(route => pathname.startsWith(route))) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
    // Allow admin routes
    if (ADMIN_ROUTES.some(route => pathname.startsWith(route))) {
      return NextResponse.next()
    }
  }

  // Default: allow the request
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

