import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db/pool';
import { getAuthUser } from '@/lib/auth-helpers';

// POST /api/viewings - Request a viewing (tenant/buyer)
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || (user.userType !== 'tenant' && user.userType !== 'buyer')) {
      return NextResponse.json({ error: 'Only tenants and buyers can request viewings' }, { status: 403 });
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
      message: 'Viewing requested. Awaiting landlord/seller response.',
      viewingRequest: result.rows[0],
    }, { status: 201 });
  } catch (error: any) {
    console.error('Viewing request error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// PATCH /api/viewings - Respond to a viewing request (landlord/seller)
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { requestId, action } = body; // action: 'agree' or 'reschedule'

    if (!requestId || !action) {
      return NextResponse.json({ error: 'Request ID and action are required' }, { status: 400 });
    }

    const user = await getAuthUser(request);
    if (!user || (user.userType !== 'landlord' && user.userType !== 'seller' && user.userType !== 'admin')) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Get the viewing request details with tenant and property info
    const vrResult = await pool.query(
      `SELECT vr.*, p.landlord_id, p.title as property_title, p.address as property_address,
              u.email as tenant_email, u.name as tenant_name,
              vs.date as slot_date, vs.time_start as slot_time_start, vs.time_end as slot_time_end
       FROM viewing_requests vr
       JOIN properties p ON vr.property_id = p.id
       JOIN users u ON vr.tenant_id = u.id
       JOIN viewing_slots vs ON vr.slot_id = vs.id
       WHERE vr.id = $1`,
      [requestId]
    );

    if (vrResult.rows.length === 0) {
      return NextResponse.json({ error: 'Viewing request not found' }, { status: 404 });
    }

    const vr = vrResult.rows[0];

    // Verify ownership
    if (vr.landlord_id !== user.userId && user.userType !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    if (action === 'agree') {
      await pool.query(
        `UPDATE viewing_requests SET status = 'agreed', updated_at = NOW() WHERE id = $1`,
        [requestId]
      );

      // Send confirmation email to tenant
      try {
        const { sendViewingConfirmedEmail } = await import('@/lib/email/templates');
        await sendViewingConfirmedEmail({
          tenantEmail: vr.tenant_email,
          tenantName: vr.tenant_name,
          propertyTitle: vr.property_title,
          viewingDate: new Date(vr.slot_date).toLocaleDateString(),
          viewingTime: `${vr.slot_time_start?.slice(0,5)} - ${vr.slot_time_end?.slice(0,5)}`,
        });
      } catch (emailErr) {
        console.error('Failed to send viewing confirmation email:', emailErr);
      }

      return NextResponse.json({ message: 'Viewing agreed. Tenant will receive confirmation.', requestId });
    } else if (action === 'reschedule') {
      // Free the current slot
      await pool.query(
        'UPDATE viewing_slots SET is_available = TRUE WHERE id = $1',
        [vr.slot_id]
      );
      await pool.query(
        `UPDATE viewing_requests SET status = 'rescheduled', updated_at = NOW() WHERE id = $1`,
        [requestId]
      );

      // Send reschedule notification email to tenant
      try {
        const { sendViewingRescheduledEmail } = await import('@/lib/email/templates');
        await sendViewingRescheduledEmail({
          tenantEmail: vr.tenant_email,
          tenantName: vr.tenant_name,
          propertyTitle: vr.property_title,
        });
      } catch (emailErr) {
        console.error('Failed to send reschedule email:', emailErr);
      }

      return NextResponse.json({ message: 'Viewing rescheduled. Tenant will be notified.', requestId });
    } else {
      return NextResponse.json({ error: 'Invalid action. Use: agree or reschedule' }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Viewing response error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}