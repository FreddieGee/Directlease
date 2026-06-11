import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth-helpers';
import pool from '@/lib/db/pool';
import { initializePaystackPayment, generatePaystackReference } from '@/lib/payments/paystack';
import { initializeFlutterwavePayment, generateFlutterwaveTxRef } from '@/lib/payments/flutterwave';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || (user.userType !== 'tenant' && user.userType !== 'buyer')) {
      return NextResponse.json({ error: 'Only tenants/buyers can initiate payments' }, { status: 403 });
    }

    const body = await request.json();
    const { propertyId, landlordId, gateway, buyerProtectionLegal, buyerProtectionBgcheck } = body;

    if (!propertyId || !landlordId || !gateway) {
      return NextResponse.json({ error: 'Missing required fields: propertyId, landlordId, gateway' }, { status: 400 });
    }

    if (!['paystack', 'flutterwave'].includes(gateway)) {
      return NextResponse.json({ error: 'Invalid gateway. Choose paystack or flutterwave' }, { status: 400 });
    }

    // Get property details
    const propResult = await pool.query(
      'SELECT id, price_naira, type, title FROM properties WHERE id = $1 AND status = $2',
      [propertyId, 'approved']
    );

    if (propResult.rows.length === 0) {
      return NextResponse.json({ error: 'Property not found or not available' }, { status: 404 });
    }

    const property = propResult.rows[0];
    const amount = parseFloat(property.price_naira);
    const serviceFee = amount * 0.02; // 2%

    // Calculate optional add-ons
    let legalFee = 0;
    let bgcheckFee = 0;

    if (buyerProtectionLegal) {
      legalFee = property.type === 'lease' ? amount * 0.10 : amount * 0.05;
    }
    if (buyerProtectionBgcheck) {
      bgcheckFee = property.type === 'lease' ? amount * 0.05 : amount * 0.03;
    }

    const totalAmount = amount + serviceFee + legalFee + bgcheckFee;

    const reference = gateway === 'paystack'
      ? generatePaystackReference()
      : generateFlutterwaveTxRef();

    // Store pending transaction
    await pool.query(
      `INSERT INTO transactions (property_id, landlord_id, tenant_id, amount, service_fee,
        buyer_protection_legal, buyer_protection_bgcheck, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')`,
      [propertyId, landlordId, user.userId, amount, serviceFee,
       legalFee > 0 ? legalFee : null, bgcheckFee > 0 ? bgcheckFee : null]
    );

    let paymentResult;

    if (gateway === 'paystack') {
      paymentResult = await initializePaystackPayment({
        email: user.email,
        amount: Math.round(totalAmount * 100), // Convert to kobo
        reference,
        metadata: {
          userId: user.userId,
          propertyId,
          landlordId,
          propertyTitle: property.title,
          propertyType: property.type,
          buyerProtectionLegal: !!buyerProtectionLegal,
          buyerProtectionBgcheck: !!buyerProtectionBgcheck,
        },
      });
    } else {
      paymentResult = await initializeFlutterwavePayment({
        email: user.email,
        amount: totalAmount,
        txRef: reference,
        name: user.email.split('@')[0],
        meta: {
          userId: user.userId,
          propertyId,
          landlordId,
          buyerProtectionLegal: !!buyerProtectionLegal,
          buyerProtectionBgcheck: !!buyerProtectionBgcheck,
        },
      });
    }

    let paymentUrl = '';
    let accessCode: string | null = null;

    if (gateway === 'paystack') {
      const psResult = paymentResult as any;
      paymentUrl = psResult.data?.authorization_url || '';
      accessCode = psResult.data?.access_code || null;
    } else {
      const fwResult = paymentResult as any;
      paymentUrl = fwResult.data?.link || '';
    }

    return NextResponse.json({
      message: 'Payment initialized',
      reference,
      gateway,
      totalAmount,
      breakdown: {
        propertyPrice: amount,
        serviceFee,
        legalFee: legalFee || null,
        backgroundCheckFee: bgcheckFee || null,
      },
      paymentUrl,
      accessCode,
    });
  } catch (error: any) {
    console.error('Payment initialization error:', error);
    return NextResponse.json({ error: 'Payment initialization failed' }, { status: 500 });
  }
}