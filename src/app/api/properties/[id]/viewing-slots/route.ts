import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db/pool';
import { getAuthUser } from '@/lib/auth-helpers';

// GET /api/properties/[id]/viewing-slots - Get available viewing slots
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const result = await pool.query(
      `SELECT id, date, time_start, time_end, is_available 
       FROM viewing_slots 
       WHERE property_id = $1 AND is_available = TRUE
       ORDER BY date, time_start`,
      [id]
    );

    return NextResponse.json({ slots: result.rows });
  } catch (error: any) {
    console.error('Viewing slots fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/properties/[id]/viewing-slots - Add viewing slots (landlord/seller only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser(request);
    if (!user || (user.userType !== 'landlord' && user.userType !== 'seller' && user.userType !== 'admin')) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const body = await request.json();
    const { slots } = body;

    if (!slots || !Array.isArray(slots) || slots.length === 0) {
      return NextResponse.json({ error: 'Slots array is required' }, { status: 400 });
    }

    const insertedSlots = [];
    for (const slot of slots) {
      const { date, timeStart, timeEnd } = slot;
      if (!date || !timeStart || !timeEnd) {
        continue;
      }
      const result = await pool.query(
        `INSERT INTO viewing_slots (property_id, date, time_start, time_end) 
         VALUES ($1, $2, $3, $4) RETURNING id, date, time_start, time_end, is_available`,
        [id, date, timeStart, timeEnd]
      );
      insertedSlots.push(result.rows[0]);
    }

    return NextResponse.json({
      message: `${insertedSlots.length} viewing slot(s) created`,
      slots: insertedSlots,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Viewing slots creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}