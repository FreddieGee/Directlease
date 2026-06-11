import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db/pool';
import { getAuthUser } from '@/lib/auth-helpers';

// GET /api/landlord/properties - Get landlord's own properties
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || (user.userType !== 'landlord' && user.userType !== 'seller' && user.userType !== 'admin')) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const result = await pool.query(
      `SELECT id, type, category, title, description, price_naira, photos_urls, videos_urls,
              address, city, state, status, is_featured, ease_of_business_badge, viewings_count, created_at, updated_at
       FROM properties
       WHERE landlord_id = $1
       ORDER BY created_at DESC`,
      [user.userId]
    );

    return NextResponse.json({ properties: result.rows });
  } catch (error: any) {
    console.error('Landlord properties fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}