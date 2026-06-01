import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db/pool';
import { getAuthUser } from '@/lib/auth-helpers';

// GET /api/admin/chat - View all chat logs (admin only)
export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user || user.userType !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const limit = parseInt(searchParams.get('limit') || '100');

    let query = `
      SELECT cm.*, 
        sender.name as sender_name, sender.user_type as sender_type,
        receiver.name as receiver_name, receiver.user_type as receiver_type,
        p.title as property_title
      FROM chat_messages cm
      JOIN users sender ON cm.sender_id = sender.id
      JOIN users receiver ON cm.receiver_id = receiver.id
      JOIN properties p ON cm.property_id = p.id
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (propertyId) {
      query += ` WHERE cm.property_id = $${paramIndex++}`;
      params.push(propertyId);
    }

    query += ` ORDER BY cm.created_at DESC LIMIT $${paramIndex++}`;
    params.push(limit);

    const result = await pool.query(query, params);

    return NextResponse.json({ messages: result.rows });
  } catch (error: any) {
    console.error('Admin chat fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}