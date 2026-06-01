import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db/pool';
import { getAuthUser } from '@/lib/auth-helpers';

// GET /api/admin/analytics - Platform KPIs and analytics
export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user || user.userType !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const [
      totalUsers, totalLandlords, totalTenants, totalProperties,
      pendingProperties, approvedProperties, activeSubscriptions,
      totalTransactions, totalRevenue, pendingVerifications,
      totalViewings, badgesAwarded, salesByType, usersByType,
      recentTransactions
    ] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users'),
      pool.query("SELECT COUNT(*) FROM users WHERE user_type IN ('landlord', 'seller')"),
      pool.query("SELECT COUNT(*) FROM users WHERE user_type IN ('tenant', 'buyer')"),
      pool.query('SELECT COUNT(*) FROM properties'),
      pool.query("SELECT COUNT(*) FROM properties WHERE status = 'pending'"),
      pool.query("SELECT COUNT(*) FROM properties WHERE status = 'approved'"),
      pool.query("SELECT COUNT(*) FROM subscriptions WHERE status = 'active' AND end_date >= NOW()"),
      pool.query("SELECT COUNT(*) FROM transactions WHERE status = 'completed'"),
      pool.query("SELECT COALESCE(SUM(service_fee), 0) as total_service_fees, COALESCE(SUM(amount), 0) as total_amount FROM transactions WHERE status = 'completed'"),
      pool.query("SELECT COUNT(*) FROM users WHERE verification_status = 'pending'"),
      pool.query('SELECT COUNT(*) FROM viewing_requests'),
      pool.query("SELECT COUNT(*) FROM properties WHERE ease_of_business_badge = TRUE"),
      pool.query('SELECT type, COUNT(*) FROM properties GROUP BY type'),
      pool.query("SELECT user_type, COUNT(*) FROM users GROUP BY user_type"),
      pool.query(`
        SELECT t.id, t.amount, t.service_fee, t.status, t.created_at, p.title, l.name as landlord, tn.name as tenant
        FROM transactions t
        JOIN properties p ON t.property_id = p.id
        JOIN users l ON t.landlord_id = l.id
        JOIN users tn ON t.tenant_id = tn.id
        ORDER BY t.created_at DESC LIMIT 10
      `),
    ]);

    return NextResponse.json({
      kpis: {
        totalUsers: parseInt(totalUsers.rows[0].count),
        totalLandlords: parseInt(totalLandlords.rows[0].count),
        totalTenants: parseInt(totalTenants.rows[0].count),
        totalProperties: parseInt(totalProperties.rows[0].count),
        pendingProperties: parseInt(pendingProperties.rows[0].count),
        approvedProperties: parseInt(approvedProperties.rows[0].count),
        activeSubscriptions: parseInt(activeSubscriptions.rows[0].count),
        totalTransactions: parseInt(totalTransactions.rows[0].count),
        totalServiceFees: parseFloat(totalRevenue.rows[0].total_service_fees),
        totalTransactionAmount: parseFloat(totalRevenue.rows[0].total_amount),
        pendingVerifications: parseInt(pendingVerifications.rows[0].count),
        totalViewings: parseInt(totalViewings.rows[0].count),
        badgesAwarded: parseInt(badgesAwarded.rows[0].count),
      },
      salesByType: salesByType.rows,
      usersByType: usersByType.rows,
      recentTransactions: recentTransactions.rows,
    });
  } catch (error: any) {
    console.error('Admin analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}