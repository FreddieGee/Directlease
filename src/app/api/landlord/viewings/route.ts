import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db/pool';
import { getAuthUser } from '@/lib/auth-helpers';

// GET /api/landlord/viewings - Get viewing requests for landlord's properties
export async function GET(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user || (user.userType !== 'landlord' && user.userType !== 'seller' && user.userType !== 'admin')) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const result = await pool.query(
      `SELECT vr.id, vr.property_id, vr.tenant_id, vr.slot_id, vr.status, vr.created_at,
              p.title as property_title, p.address as property_address,
              u.name as tenant_name, u.email as tenant_email, u.phone as tenant_phone,
              vs.date as slot_date, vs.time_start as slot_time_start, vs.time_end as slot_time_end
       FROM viewing_requests vr
       JOIN properties p ON vr.property_id = p.id
       JOIN users u ON vr.tenant_id = u.id
       JOIN viewing_slots vs ON vr.slot_id = vs.id
       WHERE p.landlord_id = $1
       ORDER BY vr.created_at DESC`,
      [user.userId]
    );

    return NextResponse.json({ viewingRequests: result.rows });
  } catch (error: any) {
    console.error('Landlord viewings fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}