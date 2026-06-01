import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromHeader } from '@/lib/jwt';
import { acceptTerms } from '@/lib/tc-check';

export async function POST(request: NextRequest) {
  try {
    let token = getTokenFromHeader(request as unknown as Request);
    
    if (!token) {
      const sessionCookie = request.cookies.get('session_token');
      if (sessionCookie) {
        token = sessionCookie.value;
      }
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    const ipAddress = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';

    await acceptTerms(payload.userId, ipAddress);

    return NextResponse.json({
      message: 'Terms & Conditions accepted successfully',
    });
  } catch (error: any) {
    console.error('Terms acceptance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}