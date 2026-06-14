import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db/pool';
import { getAuthUser } from '@/lib/auth-helpers';

async function checkSubscription(userId: string, userType: string): Promise<boolean> {
  if (userType === 'landlord' || userType === 'seller' || userType === 'admin') return true;
  try {
    const result = await pool.query(
      `SELECT id FROM subscriptions 
       WHERE user_id = $1 AND user_type = $2 AND status = 'active' 
       AND start_date <= NOW() AND end_date >= NOW()`,
      [userId, userType]
    );
    return result.rows.length > 0;
  } catch { return false; }
}

// POST /api/viewings - Request a viewing (tenant/buyer)
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || (user.userType !== 'tenant' && user.userType !== 'buyer')) {
      return NextResponse.json({ error: 'Only tenants and buyers can request viewings' }, { status: 403 });
    }

    // Tenants/buyers need an active subscription
    if (!(await checkSubscription(user.userId, user.userType))) {
      return NextResponse.json({ error: 'Active subscription required to request viewings', status: 'subscription_required' }, { status: 403 });
    }

    const body = await request.json();
    const { propertyId, slotId } = body;

    if (!propertyId || !slotId) {
      return NextResponse.json({ error: 'Property ID and slot ID are required' }, { status: 400 });
    }

    // Verify the slot exists and is available
    const slotResult = await pool.query(
      'SELECT id, is_available FROM viewing_slots WHERE id = $1 AND property_id = $2',
      [slotId, propertyId]
    );

    if (slotResult.rows.length === 0) {
      return NextResponse.json({ error: 'Viewing slot not found' }, { status: 404 });
    }

    if (!slotResult.rows[0].is_available) {
      return NextResponse.json({ error: 'This slot is no longer available' }, { status: 409 });
    }

    // Create viewing request
    const result = await pool.query(
      `INSERT INTO viewing_requests (property_id, tenant_id, slot_id, status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING id, property_id, slot_id, status, created_at`,
      [propertyId, user.userId, slotId]
    );

    // Mark slot as no longer available pending decision
    await pool.query(
      'UPDATE viewing_slots SET is_available = FALSE WHERE id = $1',
      [slotId]
    );

    // Increment viewings count
    await pool.query(
      'UPDATE properties SET viewings_count = viewings_count + 1 WHERE id = $1',
      [propertyId]
    );

    return NextResponse.json({
      message: 'Viewing request submitted',
      viewingRequest: result.rows[0],
    }, { status: 201 });
  } catch (error: any) {
    console.error('Viewing request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}