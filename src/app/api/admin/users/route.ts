import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db/pool';
import { getAuthUser } from '@/lib/auth-helpers';

// GET /api/admin/users - List all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.userType !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const userType = searchParams.get('userType');
    const verificationStatus = searchParams.get('verificationStatus');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = (page - 1) * limit;

    let query = `SELECT u.id, u.user_type, u.email, u.name, u.phone, u.tc_accepted, u.verification_status, u.created_at, u.updated_at,
                 (SELECT json_agg(json_build_object('id', s.id, 'plan', s.plan, 'status', s.status, 'start_date', s.start_date, 'end_date', s.end_date))
                  FROM subscriptions s WHERE s.user_id = u.id) as subscriptions
                 FROM users u WHERE 1=1`;
    const params: any[] = [];
    let paramIndex = 1;

    if (userType && userType !== 'all') {
      query += ` AND u.user_type = $${paramIndex++}`;
      params.push(userType);
    }
    if (verificationStatus) {
      query += ` AND u.verification_status = $${paramIndex++}`;
      params.push(verificationStatus);
    }

    const countResult = await pool.query(`SELECT COUNT(*) FROM users u WHERE 1=1` + 
      (userType && userType !== 'all' ? ` AND u.user_type = $1` : '') +
      (verificationStatus ? ` AND u.verification_status = $2` : ''), 
      [...(userType && userType !== 'all' ? [userType] : []), ...(verificationStatus ? [verificationStatus] : [])]);
    const total = parseInt(countResult.rows[0].count);

    query += ` ORDER BY u.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    return NextResponse.json({
      users: result.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error: any) {
    console.error('Admin users fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/users - Update user (verify, subscription, etc.)
export async function PATCH(request: NextRequest) {
  try {
    const admin = await getAuthUser(request);
    if (!admin || admin.userType !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, action, plan } = body;
    // action: 'approve_verification' | 'revoke_verification' | 'approve_subscription' | 'revoke_subscription'

    if (!userId || !action) {
      return NextResponse.json({ error: 'User ID and action are required' }, { status: 400 });
    }

    switch (action) {
      case 'approve_verification': {
        // Update user verification status
        await pool.query(
          `UPDATE users SET verification_status = 'approved', updated_at = NOW() WHERE id = $1`,
          [userId]
        );
        // Also update any pending verification docs
        await pool.query(
          `UPDATE landlord_verification_docs SET status = 'approved', updated_at = NOW() WHERE user_id = $1 AND status = 'pending'`,
          [userId]
        );
        await pool.query(
          `UPDATE tenant_verification_docs SET status = 'approved', updated_at = NOW() WHERE user_id = $1 AND status = 'pending'`,
          [userId]
        );
        return NextResponse.json({ message: 'Verification approved', userId });
      }

      case 'revoke_verification': {
        await pool.query(
          `UPDATE users SET verification_status = 'pending', updated_at = NOW() WHERE id = $1`,
          [userId]
        );
        return NextResponse.json({ message: 'Verification revoked', userId });
      }

      case 'approve_subscription': {
        if (!plan) {
          return NextResponse.json({ error: 'Plan is required for subscription approval' }, { status: 400 });
        }
        // Get user type
        const userResult = await pool.query('SELECT user_type FROM users WHERE id = $1', [userId]);
        if (userResult.rows.length === 0) {
          return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        const userType = userResult.rows[0].user_type;

        // Deactivate any existing active subscriptions
        await pool.query(
          `UPDATE subscriptions SET status = 'expired', end_date = NOW() WHERE user_id = $1 AND status = 'active'`,
          [userId]
        );

        // Create new 30-day subscription
        await pool.query(
          `INSERT INTO subscriptions (user_id, user_type, plan, start_date, end_date, status)
           VALUES ($1, $2, $3, NOW(), NOW() + INTERVAL '30 days', 'active')`,
          [userId, userType, plan]
        );

        return NextResponse.json({ message: 'Subscription approved', userId, plan });
      }

      case 'revoke_subscription': {
        await pool.query(
          `UPDATE subscriptions SET status = 'expired', end_date = NOW() WHERE user_id = $1 AND status = 'active'`,
          [userId]
        );
        return NextResponse.json({ message: 'Subscription revoked', userId });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Admin user update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/admin/users - Delete user
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.userType !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    await pool.query('DELETE FROM users WHERE id = $1', [userId]);

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error: any) {
    console.error('Admin user delete error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}