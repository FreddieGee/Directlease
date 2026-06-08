import { NextResponse } from 'next/server';
import pool from '@/lib/db/pool';

export async function GET() {
  const checks: any = { status: 'ok', timestamp: new Date().toISOString() };

  try {
    const result = await pool.query('SELECT NOW()');
    checks.database = { connected: true, time: result.rows[0].now };
  } catch (error: any) {
    checks.database = { connected: false, error: error.message };
    checks.status = 'degraded';
  }

  try {
    const adminCheck = await pool.query("SELECT id, name FROM users WHERE user_type = 'admin' LIMIT 1");
    checks.admin = { exists: adminCheck.rows.length > 0 };
  } catch {
    checks.admin = { exists: false, error: 'Could not check' };
  }

  return NextResponse.json(checks);
}