import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db/pool';

export async function GET() {
  try {
    const existing = await pool.query(
      "SELECT id FROM users WHERE user_type = 'admin' LIMIT 1"
    );
    if (existing.rows.length > 0) {
      return NextResponse.json({ message: 'Admin already exists', seeded: false });
    }
    const passwordHash = await bcrypt.hash('Administrator_01', 12);
    await pool.query(
      `INSERT INTO users (user_type, email, password_hash, name, verification_status, tc_accepted)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ['admin', 'admin@directlease.com', passwordHash, 'Admin', 'approved', true]
    );
    return NextResponse.json({ 
      message: 'Database seeded! Admin created.',
      seeded: true,
      admin: { username: 'Admin', password: 'Administrator_01' }
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}