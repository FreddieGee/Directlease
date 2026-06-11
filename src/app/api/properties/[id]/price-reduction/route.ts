import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db/pool';
import { getAuthUser } from '@/lib/auth-helpers';

// POST /api/properties/[id]/price-reduction - Record a price reduction and award badge
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser(request);
    if (!user || (user.userType !== 'landlord' && user.userType !== 'seller')) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Verify ownership
    const propResult = await pool.query(
      'SELECT landlord_id, price_naira FROM properties WHERE id = $1',
      [id]
    );
    if (propResult.rows.length === 0) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    if (propResult.rows[0].landlord_id !== user.userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const body = await request.json();
    const { newPrice } = body;
    const oldPrice = parseFloat(propResult.rows[0].price_naira);

    if (!newPrice || parseFloat(newPrice) >= oldPrice) {
      return NextResponse.json({ error: 'New price must be lower than current price' }, { status: 400 });
    }

    // Record the price reduction
    await pool.query(
      `INSERT INTO price_reductions (property_id, landlord_id, old_price, new_price)
       VALUES ($1, $2, $3, $4)`,
      [id, user.userId, oldPrice, parseFloat(newPrice)]
    );

    // Update property price and award badge
    await pool.query(
      `UPDATE properties SET price_naira = $1, ease_of_business_badge = TRUE, updated_at = NOW()
       WHERE id = $2`,
      [parseFloat(newPrice), id]
    );

    return NextResponse.json({
      message: 'Price reduced successfully. You have earned the "Ease of Doing Business" badge!',
      oldPrice,
      newPrice: parseFloat(newPrice),
    });
  } catch (error: any) {
    console.error('Price reduction error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}