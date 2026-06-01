import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken, getTokenFromHeader } from '@/lib/jwt';

// Routes that don't require authentication
const publicRoutes = [
  '/api/auth/login',
  '/api/auth/register',
  '/api/admin/login',
  '/api/properties',
];

// Admin-only routes
const adminRoutes = [
  '/api/admin',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some(route => pathname.startsWith(route) && !pathname.startsWith('/api/admin/login'))) {
    return NextResponse.next();
  }

  // Allow public GET /api/properties (browsing)
  if (pathname === '/api/properties' && request.method === 'GET') {
    return NextResponse.next();
  }

  // Check authentication
  const token = getTokenFromHeader(request as unknown as Request);
  
  if (!token) {
    // Check cookie-based auth for browser requests
    const sessionCookie = request.cookies.get('session_token');
    if (!sessionCookie) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      // For page routes, redirect to login
      if (pathname.startsWith('/landlord') || pathname.startsWith('/tenant') || pathname.startsWith('/admin')) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
      return NextResponse.next();
    }
  }

  try {
    const tokenValue = token || request.cookies.get('session_token')?.value || '';
    if (!tokenValue) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/login', request.url));
    }
    const payload = verifyToken(tokenValue);

    // Check admin routes
    if (adminRoutes.some(route => pathname.startsWith(route)) && payload.userType !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Check landlord/seller routes — only they can access
    if (pathname.startsWith('/api/properties') && request.method === 'POST') {
      if (payload.userType !== 'landlord' && payload.userType !== 'seller') {
        return NextResponse.json({ error: 'Only landlords/sellers can create listings' }, { status: 403 });
      }
    }

    return NextResponse.next();
  } catch (error) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
    }
    return NextResponse.redirect(new URL('/login', request.url));
  }
}

export const config = {
  matcher: [
    '/api/:path*',
    '/landlord/:path*',
    '/tenant/:path*',
    '/admin/:path*',
  ],
};