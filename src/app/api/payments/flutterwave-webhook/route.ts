import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db/pool';
import { verifyFlutterwavePayment } from '@/lib/payments/flutterwave';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { event, data } = body;

    if (event === 'charge.completed' && data.status === 'successful') {
      const { tx_ref, id, amount, meta } = data;

      // Verify with Flutterwave API
      const verification = await verifyFlutterwavePayment(id);

      if (verification.status === 'success' && verification.data.status === 'successful') {
        // Update the latest pending transaction
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

    return NextResponse.json({ status: 'ok' });
  } catch (error: any) {
    console.error('Flutterwave webhook error:', error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}

// GET endpoint for redirect verification
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const transaction_id = searchParams.get('transaction_id');
  const tx_ref = searchParams.get('tx_ref');
  const status = searchParams.get('status');

  if (status === 'successful' || status === 'completed') {
    return NextResponse.json({ status: 'completed', message: 'Payment successful' });
  }

  if (transaction_id) {
    try {
      const verification = await verifyFlutterwavePayment(parseInt(transaction_id));
      if (verification.status === 'success' && verification.data.status === 'successful') {
        return NextResponse.json({ status: 'completed', message: 'Payment verified' });
      }
    } catch (error) {
      // fall through
    }
  }

  return NextResponse.json({ status: 'failed', message: 'Payment not confirmed' });
}