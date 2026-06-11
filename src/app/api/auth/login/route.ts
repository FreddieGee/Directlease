import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db/pool';
import { signToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') || '';
    let email: string, password: string;

    if (contentType.includes('application/json')) {
      const body = await request.json();
      email = body.email;
      password = body.password;
    } else {
      const formData = await request.formData();
      email = formData.get('email') as string;
      password = formData.get('password') as string;
    }

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Find user by email
    const result = await pool.query(
      'SELECT id, user_type, email, password_hash, name, phone, tc_accepted, verification_status FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    const user = result.rows[0];

    // Admin users should use /api/admin/login
    if (user.user_type === 'admin') {
      return NextResponse.json(
        { error: 'Please use admin login endpoint' },
        { status: 403 }
      );
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Generate JWT
    const token = await signToken({
      userId: user.id,
      userType: user.user_type,
      email: user.email,
    });

    // Determine redirect based on user type
    const redirectUrl = (user.user_type === 'landlord' || user.user_type === 'seller')
      ? '/landlord/dashboard'
      : '/tenant/browse';

    // Return JSON for AJAX requests
    return NextResponse.json({
      message: 'Login successful',
      user: {
        id: user.id,
        userType: user.user_type,
        email: user.email,
        name: user.name,
        phone: user.phone,
        tcAccepted: user.tc_accepted,
        verificationStatus: user.verification_status,
      },
      token,
      redirectUrl,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}