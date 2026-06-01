import { NextRequest, NextResponse } from 'next/server';
import { verifyToken, getTokenFromHeader } from '@/lib/jwt';
import pool from '@/lib/db/pool';

export async function GET(request: NextRequest) {
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

    const result = await pool.query(
      `SELECT id, user_type, email, name, phone, tc_accepted, verification_status, created_at
       FROM users WHERE id = $1`,
      [payload.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const user = result.rows[0];

    return NextResponse.json({
      user: {
        id: user.id,
        userType: user.user_type,
        email: user.email,
        name: user.name,
        phone: user.phone,
        tcAccepted: user.tc_accepted,
        verificationStatus: user.verification_status,
        createdAt: user.created_at,
      },
    });
  } catch (error: any) {
    console.error('Auth me error:', error);
    return NextResponse.json(
      { error: 'Invalid or expired token' },
      { status: 401 }
    );
  }
}