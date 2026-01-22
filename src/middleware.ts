import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Cookie name that stores user role
const USER_ROLE_COOKIE = 'hummane_user_role'

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

// Public routes that don't require auth
const PUBLIC_ROUTES = ['/login', '/signup', '/']

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const userRole = request.cookies.get(USER_ROLE_COOKIE)?.value

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname === route)) {
    return NextResponse.next()
  }

  // Allow company-setup for all authenticated users
  if (pathname.startsWith('/company-setup')) {
    return NextResponse.next()
  }

  // If no role cookie, allow the request (let client-side handle auth)
  if (!userRole) {
    return NextResponse.next()
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

