import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db/pool';
import { getAuthUser } from '@/lib/auth-helpers';

// GET /api/subscriptions - Get user's subscription
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const result = await pool.query(
      `SELECT id, plan, start_date, end_date, status, created_at
       FROM subscriptions
       WHERE user_id = $1 AND user_type = $2 AND status = 'active'
       ORDER BY created_at DESC LIMIT 1`,
      [user.userId, user.userType]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ subscription: null });
    }

    return NextResponse.json({ subscription: result.rows[0] });
  } catch (error: any) {
    console.error('Subscription fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/subscriptions - Create/upgrade subscription
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { plan } = body;

    if (!plan) {
      return NextResponse.json({ error: 'Plan is required' }, { status: 400 });
    }

    // Define plans
    const plans: Record<string, { duration_days: number; price: number }> = {
      'tenant_monthly': { duration_days: 30, price: 5000 },
      'tenant_yearly': { duration_days: 365, price: 50000 },
      'landlord_basic': { duration_days: 30, price: 10000 },
      'landlord_premium': { duration_days: 30, price: 25000 },
      'landlord_yearly': { duration_days: 365, price: 250000 },
    };

    if (!plans[plan]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const planConfig = plans[plan];
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + planConfig.duration_days * 24 * 60 * 60 * 1000);

    // Cancel existing active subscriptions
    await pool.query(
      `UPDATE subscriptions SET status = 'cancelled' WHERE user_id = $1 AND status = 'active'`,
      [user.userId]
    );

    const result = await pool.query(
      `INSERT INTO subscriptions (user_id, user_type, plan, start_date, end_date, status)
       VALUES ($1, $2, $3, $4, $5, 'active')
       RETURNING id, plan, start_date, end_date, status`,
      [user.userId, user.userType, plan, startDate, endDate]
    );

    // Mark user as verified (subscription implies verification step completion)
    if ((user.userType === 'tenant' || user.userType === 'buyer') && plan.startsWith('tenant_')) {
      await pool.query(
        "UPDATE users SET verification_status = 'pending' WHERE id = $1 AND verification_status = 'pending'",
        [user.userId]
      );
    }

    return NextResponse.json({
      message: 'Subscription activated successfully',
      subscription: result.rows[0],
      amount: planConfig.price,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Subscription creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}