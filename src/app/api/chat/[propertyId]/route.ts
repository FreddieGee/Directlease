import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db/pool';
import { getAuthUser } from '@/lib/auth-helpers';

// GET /api/chat/[propertyId] - Get messages for a conversation
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ propertyId: string }> }
) {
  try {
    const { propertyId } = await params;
    const user = getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const otherUserId = searchParams.get('userId');

    if (!otherUserId) {
      return NextResponse.json({ error: 'Other user ID is required' }, { status: 400 });
    }

    // Get messages between the two users for this property
    const result = await pool.query(
      `SELECT id, sender_id, receiver_id, property_id, message, is_read, created_at
       FROM chat_messages
       WHERE property_id = $1
         AND ((sender_id = $2 AND receiver_id = $3) OR (sender_id = $3 AND receiver_id = $2))
       ORDER BY created_at ASC`,
      [propertyId, user.userId, otherUserId]
    );

    // Mark messages as read
    await pool.query(
      `UPDATE chat_messages SET is_read = TRUE
       WHERE property_id = $1 AND receiver_id = $2 AND is_read = FALSE`,
      [propertyId, user.userId]
    );

    return NextResponse.json({ messages: result.rows });
  } catch (error: any) {
    console.error('Chat messages fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}