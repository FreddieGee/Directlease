import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getTokenFromHeader } from '@/lib/jwt';

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

  // Only protect API routes
  if (pathname.startsWith('/api/')) {
    let token = getTokenFromHeader(request as unknown as Request);
    if (!token) {
      token = request.cookies.get('session_token')?.value || '';
    }

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // We let the route handlers do the actual JWT verification
    // (jose works reliably on Node.js runtime; middleware runs on Edge)
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/:path*'],
};