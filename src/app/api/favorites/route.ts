import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db/pool';
import { getAuthUser } from '@/lib/auth-helpers';

// GET /api/favorites - Get user's saved properties
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const result = await pool.query(
      `SELECT sp.id as saved_id, sp.created_at as saved_at, p.*
       FROM saved_properties sp
       JOIN properties p ON sp.property_id = p.id
       WHERE sp.user_id = $1
       ORDER BY sp.created_at DESC`,
      [user.userId]
    );

    return NextResponse.json({ savedProperties: result.rows });
  } catch (error: any) {
    console.error('Favorites fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/favorites - Save/unsave a property (toggle)
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 });

    const body = await request.json();
    const { propertyId } = body;

    if (!propertyId) return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });

    // Check if already saved
    const existing = await pool.query(
      'SELECT id FROM saved_properties WHERE user_id = $1 AND property_id = $2',
      [user.userId, propertyId]
    );

    if (existing.rows.length > 0) {
      // Unsave
      await pool.query('DELETE FROM saved_properties WHERE id = $1', [existing.rows[0].id]);
      return NextResponse.json({ saved: false, message: 'Property removed from saved' });
    } else {
      // Save
      await pool.query(
        'INSERT INTO saved_properties (user_id, property_id) VALUES ($1, $2)',
        [user.userId, propertyId]
      );
      return NextResponse.json({ saved: true, message: 'Property saved' }, { status: 201 });
    }
  } catch (error: any) {
    console.error('Favorites toggle error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}