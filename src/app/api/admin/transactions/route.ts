import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db/pool';
import { getAuthUser } from '@/lib/auth-helpers';

// GET /api/admin/transactions - List all transactions
export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user || user.userType !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    let query = `
      SELECT t.*, p.title as property_title, l.name as landlord_name, tn.name as tenant_name
      FROM transactions t
      JOIN properties p ON t.property_id = p.id
      JOIN users l ON t.landlord_id = l.id
      JOIN users tn ON t.tenant_id = tn.id
      WHERE 1=1
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND t.status = $${paramIndex++}`;
      params.push(status);
    }

    const countResult = await pool.query(
      query.replace(/SELECT t\..*?FROM/, 'SELECT COUNT(*) FROM'),
      params
    );
    const total = parseInt(countResult.rows[0].count);

    query += ` ORDER BY t.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    return NextResponse.json({
      transactions: result.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('Admin transactions fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}