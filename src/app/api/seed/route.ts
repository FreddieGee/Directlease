import { NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import pool from '@/lib/db/pool';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Run schema first to ensure all tables exist
    const schemaPath = path.join(process.cwd(), 'src', 'lib', 'db', 'schema.sql');
    if (fs.existsSync(schemaPath)) {
      const schema = fs.readFileSync(schemaPath, 'utf8');
      await pool.query(schema);
    }

    // Check if admin already exists
    const existing = await pool.query(
      "SELECT id FROM users WHERE user_type = 'admin' LIMIT 1"
    );

    let adminCreated = false;
    if (existing.rows.length === 0) {
      const passwordHash = await bcrypt.hash('Administrator_01', 12);
      await pool.query(
        `INSERT INTO users (user_type, email, password_hash, name, verification_status, tc_accepted)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        ['admin', 'admin@directlease.com', passwordHash, 'Admin', 'approved', true]
      );
      adminCreated = true;
    }

    return NextResponse.json({ 
      message: adminCreated ? 'Database seeded! Admin user created.' : 'Admin already exists. Schema refreshed.',
      adminUser: { username: 'Admin', password: 'Administrator_01' },
      tablesCreated: true,
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json({ 
      error: 'Failed to seed database', 
      detail: error.message 
    }, { status: 500 });
  }
}