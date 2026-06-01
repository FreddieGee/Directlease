import { NextResponse } from 'next/server';
import pool from '@/lib/db/pool';

// This endpoint should be called by a cron job every 15-30 minutes
// It checks for viewings happening in ~2 hours and sends address emails
export async function GET() {
  try {
    // Find viewings happening in about 2 hours that haven't had their address sent
    const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
    const twoHoursPlusBuffer = new Date(Date.now() + 2.5 * 60 * 60 * 1000);

    const result = await pool.query(
      `SELECT vr.id, vr.tenant_id, p.id as property_id, p.title as property_title, 
              p.address as property_address, u.email as tenant_email, u.name as tenant_name,
              vs.date as slot_date, vs.time_start as slot_time_start
       FROM viewing_requests vr
       JOIN properties p ON vr.property_id = p.id
       JOIN users u ON vr.tenant_id = u.id
       JOIN viewing_slots vs ON vr.slot_id = vs.id
       WHERE vr.status = 'agreed'
         AND vs.date = $1::date
         AND vs.time_start BETWEEN $2::time AND $3::time`,
      [
        twoHoursFromNow.toISOString().split('T')[0],
        twoHoursFromNow.toTimeString().slice(0, 5),
        twoHoursPlusBuffer.toTimeString().slice(0, 5),
      ]
    );

    let sent = 0;
    for (const row of result.rows) {
      try {
        const { sendViewingAddressEmail } = await import('@/lib/email/templates');
        await sendViewingAddressEmail({
          tenantEmail: row.tenant_email,
          tenantName: row.tenant_name,
          propertyTitle: row.property_title,
          viewingDate: new Date(row.slot_date).toLocaleDateString(),
          viewingTime: row.slot_time_start?.slice(0, 5),
          propertyAddress: row.property_address,
        });
        sent++;
      } catch (emailErr) {
        console.error(`Failed to send address email for viewing ${row.id}:`, emailErr);
      }
    }

    return NextResponse.json({
      message: 'Viewing reminders checked',
      viewingsFound: result.rows.length,
      emailsSent: sent,
    });
  } catch (error: any) {
    console.error('Viewing reminders error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}