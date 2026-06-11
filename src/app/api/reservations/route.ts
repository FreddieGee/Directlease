import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db/pool';
import { getAuthUser } from '@/lib/auth-helpers';

// POST /api/reservations - Reserve a property (after mutual agreement in chat)
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || (user.userType !== 'tenant' && user.userType !== 'buyer' && user.userType !== 'admin')) {
      return NextResponse.json({ error: 'Only tenants/buyers can reserve properties' }, { status: 403 });
    }

    const body = await request.json();
    const { propertyId, landlordId, termsAccepted } = body;

    if (!propertyId || !landlordId || !termsAccepted) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify property is available
    const propResult = await pool.query(
      'SELECT id, status FROM properties WHERE id = $1',
      [propertyId]
    );

    if (propResult.rows.length === 0) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }

    if (propResult.rows[0].status !== 'approved') {
      return NextResponse.json({ error: 'Property is not available' }, { status: 409 });
    }

    // Mark property as reserved (reserved status)
    await pool.query(
      "UPDATE properties SET status = 'pending', updated_at = NOW() WHERE id = $1",
      [propertyId]
    );

    // Create reservation record in viewing_requests (using it as reservation tracker)
    const result = await pool.query(
      `INSERT INTO viewing_requests (property_id, tenant_id, slot_id, status)
       VALUES ($1, $2, (SELECT id FROM viewing_slots WHERE property_id = $1 LIMIT 1), 'agreed')
       RETURNING id, property_id, tenant_id, status, created_at`,
      [propertyId, user.userId]
    );

    // Schedule expiry - a simple approach is to record the reservation time
    // In production, this would be handled by a cron job checking 24hr expiry
    const reservationId = result.rows[0].id;

    return NextResponse.json({
      message: 'Property reserved for 24 hours',
      reservation: {
        id: reservationId,
        propertyId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Reservation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/reservations/check-expired - Check and handle expired reservations
// This should be called by a cron job every hour
export async function GET(request: NextRequest) {
  try {
    // Find reservations older than 24 hours that are still marked as agreed
    const expiredResult = await pool.query(
      `SELECT vr.id, vr.property_id, vr.tenant_id, p.title as property_title,
              u.name as tenant_name, u.email as tenant_email
       FROM viewing_requests vr
       JOIN properties p ON vr.property_id = p.id
       JOIN users u ON vr.tenant_id = u.id
       WHERE vr.status = 'agreed'
         AND vr.created_at < NOW() - INTERVAL '24 hours'`
    );

    let expired = 0;
    let notified = 0;

    for (const row of expiredResult.rows) {
      // Mark viewing request as expired
      await pool.query(
        `UPDATE viewing_requests SET status = 'cancelled', updated_at = NOW() WHERE id = $1`,
        [row.id]
      );

      // Restore property to approved
      await pool.query(
        `UPDATE properties SET status = 'approved', updated_at = NOW() WHERE id = $1`,
        [row.property_id]
      );

      expired++;

      // Notify the tenant whose reservation expired
      try {
        const { sendReservationExpiryEmail } = await import('@/lib/email/templates');
        await sendReservationExpiryEmail({
          tenantEmail: row.tenant_email,
          tenantName: row.tenant_name,
          propertyTitle: row.property_title,
        });
        notified++;
      } catch (emailErr) {
        console.error('Failed to send expiry email:', emailErr);
      }
    }

    // Also notify other interested parties that the property is available
    // (those who had pending viewing requests for the same property)
    for (const row of expiredResult.rows) {
      const otherInterested = await pool.query(
        `SELECT DISTINCT u.email, u.name
         FROM viewing_requests vr
         JOIN users u ON vr.tenant_id = u.id
         WHERE vr.property_id = $1 AND vr.tenant_id != $2 AND vr.status = 'pending'`,
        [row.property_id, row.tenant_id]
      );

      for (const interested of otherInterested.rows) {
        try {
          const { sendReservationExpiryEmail } = await import('@/lib/email/templates');
          await sendReservationExpiryEmail({
            tenantEmail: interested.email,
            tenantName: interested.name,
            propertyTitle: row.property_title,
          });
          notified++;
        } catch (emailErr) {
          console.error('Failed to send availability email:', emailErr);
        }
      }
    }

    return NextResponse.json({
      message: 'Reservation expiry check complete',
      expiredReservations: expired,
      notificationsSent: notified,
    });
  } catch (error: any) {
    console.error('Reservation expiry check error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/reservations - Cancel a reservation
export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { propertyId } = body;

    if (!propertyId) {
      return NextResponse.json({ error: 'Property ID is required' }, { status: 400 });
    }

    // Find and cancel the active reservation
    const result = await pool.query(
      `UPDATE viewing_requests SET status = 'cancelled', updated_at = NOW()
       WHERE property_id = $1 AND tenant_id = $2 AND status = 'agreed'
       RETURNING id`,
      [propertyId, user.userId]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'No active reservation found' }, { status: 404 });
    }

    // Restore property to approved
    await pool.query(
      "UPDATE properties SET status = 'approved', updated_at = NOW() WHERE id = $1",
      [propertyId]
    );

    return NextResponse.json({ message: 'Reservation cancelled. Property is now available.' });
  } catch (error: any) {
    console.error('Reservation cancellation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}