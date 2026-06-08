import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db/pool';
import { signToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userType, email, password, name, phone } = body;

    // Validate required fields
    if (!userType || !email || !password || !name) {
      return NextResponse.json(
        { error: 'Missing required fields: userType, email, password, name' },
        { status: 400 }
      );
    }

    // Validate user type
    const validTypes = ['landlord', 'seller', 'tenant', 'buyer'];
    if (!validTypes.includes(userType)) {
      return NextResponse.json(
        { error: 'Invalid user type. Must be: landlord, seller, tenant, or buyer' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      );
    }

    // Check if email already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: 'Email already registered' },
        { status: 409 }
      );
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const result = await pool.query(
      `INSERT INTO users (user_type, email, password_hash, name, phone)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, user_type, email, name, phone, tc_accepted, verification_status, created_at`,
      [userType, email.toLowerCase(), passwordHash, name, phone || null]
    );

    const user = result.rows[0];

    // Generate JWT
    const token = signToken({
      userId: user.id,
      userType: user.user_type,
      email: user.email,
    });

    const response = NextResponse.json(
      {
        message: 'Registration successful. Please review and accept Terms & Conditions.',
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
      },
      { status: 201 }
    );

    // Set session cookie so the user stays logged in
    response.cookies.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}