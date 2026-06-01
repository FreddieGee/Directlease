import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db/pool';
import { verifyPaystackPayment } from '@/lib/payments/paystack';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const signature = request.headers.get('x-paystack-signature') || '';
    const event = JSON.parse(body);

    // Handle the event
    if (event.event === 'charge.success') {
      const { reference, status, metadata, amount } = event.data;

      if (status === 'success') {
        // Verify with Paystack API
        const verification = await verifyPaystackPayment(reference);

        if (verification.status && verification.data.status === 'success') {
          // Update the latest pending transaction for this user/property
          const result = await pool.query(
            `UPDATE transactions 
             SET status = 'completed', updated_at = NOW() 
             WHERE id = (
               SELECT id FROM transactions 
               WHERE status = 'pending' 
               ORDER BY created_at DESC LIMIT 1
             )
             RETURNING id, property_id, landlord_id, tenant_id, amount`,
          );

          if (result.rows.length > 0) {
            const tx = result.rows[0];
            // Mark property as leased/sold
            const propResult = await pool.query(
              'SELECT type FROM properties WHERE id = $1',
              [tx.property_id]
            );
            if (propResult.rows.length > 0) {
              const newStatus = propResult.rows[0].type === 'lease' ? 'leased' : 'sold';
              await pool.query(
                'UPDATE properties SET status = $1, updated_at = NOW() WHERE id = $2',
                [newStatus, tx.property_id]
              );
            }
          }
        }
      }
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    console.error('Paystack webhook error:', error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}

// GET endpoint for verification after redirect
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const reference = searchParams.get('reference');
  const trxref = searchParams.get('trxref');

  const ref = reference || trxref;

  if (!ref) {
    return NextResponse.json({ error: 'No reference provided' }, { status: 400 });
  }

  try {
    const verification = await verifyPaystackPayment(ref);

    if (verification.status && verification.data.status === 'success') {
      return NextResponse.json({ status: 'completed', message: 'Payment verified successfully' });
    } else {
      return NextResponse.json({ status: 'failed', message: 'Payment verification failed' });
    }
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Verification error' }, { status: 500 });
  }
}