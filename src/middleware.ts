import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, getTokenFromHeader } from '@/lib/jwt';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public API routes — no auth needed
  const publicRoutes = [
    '/api/auth/login',
    '/api/auth/register',
    '/api/auth/accept-tc',
    '/api/auth/me',
    '/api/admin/login',
    '/api/properties',
    '/api/seed',
    '/api/health',
  ];

  if (publicRoutes.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Allow public GET /api/properties
  if (pathname === '/api/properties' && request.method === 'GET') {
    return NextResponse.next();
  }

  // Only protect API routes and admin pages
  if (pathname.startsWith('/api/')) {
    // Check Authorization header or cookie
    let token = getTokenFromHeader(request as unknown as Request);
    if (!token) {
      token = request.cookies.get('session_token')?.value || '';
    }

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    try {
      const payload = verifyToken(token);

      // Admin-only API routes
      if (pathname.startsWith('/api/admin/') && payload.userType !== 'admin') {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
      }

      // Properties POST — only landlords/sellers
      if (pathname.startsWith('/api/properties') && request.method === 'POST') {
        if (payload.userType !== 'landlord' && payload.userType !== 'seller') {
          return NextResponse.json({ error: 'Only landlords/sellers can create listings' }, { status: 403 });
        }
      }

      return NextResponse.next();
    } catch {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
  }

  // Admin pages — protected
  if (pathname.startsWith('/admin') && pathname !== '/admin/login') {
    let token = request.cookies.get('session_token')?.value || '';
    if (!token) {
      token = getTokenFromHeader(request as unknown as Request) || '';
    }
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    try {
      const payload = verifyToken(token);
      if (payload.userType !== 'admin') {
        return NextResponse.redirect(new URL('/admin/login', request.url));
      }
      return NextResponse.next();
    } catch {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
  }

  // Allow all other routes (landlord, tenant pages — handled by layout components)
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/api/:path*',
    '/admin/:path*',
  ],
};