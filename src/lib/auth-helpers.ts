import { NextRequest } from 'next/server';
import { verifyToken, getTokenFromHeader } from '@/lib/jwt';

export function getAuthUser(request: NextRequest) {
  let token = getTokenFromHeader(request as unknown as Request);
  
  if (!token) {
    const sessionCookie = request.cookies.get('session_token');
    if (sessionCookie) {
      token = sessionCookie.value;
    }
  }

  if (!token) return null;

  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

export function requireAdmin(request: NextRequest) {
  const user = getAuthUser(request);
  if (!user || user.userType !== 'admin') return null;
  return user;
}

export function requireLandlord(request: NextRequest) {
  const user = getAuthUser(request);
  if (!user || (user.userType !== 'landlord' && user.userType !== 'seller')) return null;
  return user;
}

export function requireAuth(request: NextRequest) {
  return getAuthUser(request);
}