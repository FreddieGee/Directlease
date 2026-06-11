import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db/pool';
import { signToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Find admin by name
    const result = await pool.query(
      'SELECT id, user_type, email, password_hash, name FROM users WHERE name = $1 AND user_type = $2',
      [username, 'admin']
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid admin credentials' },
        { status: 401 }
      );
    }

    const admin = result.rows[0];

    // Verify password
    const isValidPassword = await bcrypt.compare(password, admin.password_hash);
    if (!isValidPassword) {
      return NextResponse.json(
        { error: 'Invalid admin credentials' },
        { status: 401 }
      );
    }

    // Generate JWT
    const token = await signToken({
      userId: admin.id,
      userType: admin.user_type,
      email: admin.email,
    });

    return NextResponse.json({
      message: 'Admin login successful',
      user: {
        id: admin.id,
        userType: admin.user_type,
        email: admin.email,
        name: admin.name,
      },
      token,
      redirectUrl: '/admin',
    });
  } catch (error: any) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}