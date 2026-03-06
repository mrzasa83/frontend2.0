import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'
import { canAccessPath } from '@/lib/config/modules'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for public routes
  // Note: with basePath, pathname is already stripped of the basePath prefix
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname === '/login'
  ) {
    return NextResponse.next()
  }

  // Get the user's token
  const token = await getToken({ 
    req: request,
    secret: process.env.NEXTAUTH_SECRET 
  })

  // If not authenticated, redirect to login
  // Use nextUrl.clone() so basePath is preserved in the redirect
  if (!token) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  // Check if user has access to this path
  const userRoles = (token.roles as string[]) || []
  
  // Allow access to root and dashboard
  if (pathname === '/' || pathname === '/dashboard') {
    return NextResponse.next()
  }

  // Check module access for protected routes
  if (pathname.startsWith('/admin') || 
      pathname.startsWith('/products') || 
      pathname.startsWith('/process') || 
      pathname.startsWith('/users')) {
    
    const hasAccess = canAccessPath(userRoles, pathname)
    
    if (!hasAccess) {
      const url = request.nextUrl.clone()
      url.pathname = '/dashboard'
      url.searchParams.set('error', 'unauthorized')
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
