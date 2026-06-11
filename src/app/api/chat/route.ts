import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db/pool';
import { getAuthUser } from '@/lib/auth-helpers';

// GET /api/chat - Get user's conversations
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Get all conversations for this user
    const result = await pool.query(
      `SELECT DISTINCT ON (least_msgs.property_id, least_msgs.other_user)
        cm.property_id,
        p.title as property_title,
        cm.receiver_id,
        cm.sender_id,
        u.name as other_user_name,
        u.user_type as other_user_type,
        cm.message as last_message,
        cm.created_at as last_message_at,
        cm.is_read
       FROM chat_messages cm
       JOIN properties p ON cm.property_id = p.id
       JOIN users u ON (CASE WHEN cm.sender_id = $1 THEN cm.receiver_id ELSE cm.sender_id END) = u.id
       CROSS JOIN LATERAL (
         SELECT GREATEST(cm.sender_id, cm.receiver_id) as other_user, cm.property_id
       ) as least_msgs
       WHERE cm.sender_id = $1 OR cm.receiver_id = $1
       ORDER BY least_msgs.property_id, least_msgs.other_user, cm.created_at DESC`,
      [user.userId]
    );

    return NextResponse.json({ conversations: result.rows });
  } catch (error: any) {
    console.error('Chat fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/chat - Send a message
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { propertyId, receiverId, message } = body;

    if (!propertyId || !receiverId || !message) {
      return NextResponse.json({ error: 'Property ID, receiver ID, and message are required' }, { status: 400 });
    }

    // Verify the user is involved with this property
    const propResult = await pool.query(
      'SELECT landlord_id FROM properties WHERE id = $1',
      [propertyId]
    );
    if (propResult.rows.length === 0) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    const result = await pool.query(
      `INSERT INTO chat_messages (sender_id, receiver_id, property_id, message)
       VALUES ($1, $2, $3, $4)
       RETURNING id, sender_id, receiver_id, property_id, message, is_read, created_at`,
      [user.userId, receiverId, propertyId, message]
    );

    return NextResponse.json({
      message: 'Message sent',
      chatMessage: result.rows[0],
    }, { status: 201 });
  } catch (error: any) {
    console.error('Chat send error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}