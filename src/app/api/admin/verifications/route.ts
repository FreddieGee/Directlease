import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db/pool';
import { getAuthUser } from '@/lib/auth-helpers';

// GET /api/admin/verifications - List pending verifications
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.userType !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type'); // 'landlord' or 'tenant'

    let landlordDocs, tenantDocs;

    if (!type || type === 'landlord') {
      landlordDocs = await pool.query(
        `SELECT lvd.*, u.name, u.email, u.user_type
         FROM landlord_verification_docs lvd
         JOIN users u ON lvd.user_id = u.id
         ORDER BY lvd.created_at DESC`
      );
    }

    if (!type || type === 'tenant') {
      tenantDocs = await pool.query(
        `SELECT tvd.*, u.name, u.email, u.user_type
         FROM tenant_verification_docs tvd
         JOIN users u ON tvd.user_id = u.id
         ORDER BY tvd.created_at DESC`
      );
    }

    return NextResponse.json({
      landlordVerifications: landlordDocs?.rows || [],
      tenantVerifications: tenantDocs?.rows || [],
    });
  } catch (error: any) {
    console.error('Admin verifications fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/admin/verifications - Approve/reject verification
export async function PATCH(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.userType !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { userId, userType, status, adminNotes } = body;

    if (!userId || !userType || !status) {
      return NextResponse.json({ error: 'User ID, user type, and status are required' }, { status: 400 });
    }

    if (!['approved', 'rejected'].includes(status)) {
      return NextResponse.json({ error: 'Status must be approved or rejected' }, { status: 400 });
    }

    if (userType === 'landlord' || userType === 'seller') {
      await pool.query(
        `UPDATE landlord_verification_docs SET status = $1, admin_notes = $2, updated_at = NOW() WHERE user_id = $3`,
        [status, adminNotes || null, userId]
      );
    } else {
      await pool.query(
        `UPDATE tenant_verification_docs SET status = $1, admin_notes = $2, updated_at = NOW() WHERE user_id = $3`,
        [status, adminNotes || null, userId]
      );
    }

    // Update user verification status
    await pool.query(
      `UPDATE users SET verification_status = $1, updated_at = NOW() WHERE id = $2`,
      [status, userId]
    );

    return NextResponse.json({ message: `Verification ${status}`, userId, status });
  } catch (error: any) {
    console.error('Admin verification update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}