import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db/pool';
import { getAuthUser } from '@/lib/auth-helpers';

// GET /api/transactions - Get user's transactions
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    let query;
    const params: any[] = [user.userId];

    if (user.userType === 'admin') {
      query = `
        SELECT t.*, p.title as property_title, l.name as landlord_name, tn.name as tenant_name
        FROM transactions t
        JOIN properties p ON t.property_id = p.id
        JOIN users l ON t.landlord_id = l.id
        JOIN users tn ON t.tenant_id = tn.id
        ORDER BY t.created_at DESC
      `;
      params.length = 0;
    } else if (user.userType === 'landlord' || user.userType === 'seller') {
      query = `
        SELECT t.*, p.title as property_title, tn.name as tenant_name
        FROM transactions t
        JOIN properties p ON t.property_id = p.id
        JOIN users tn ON t.tenant_id = tn.id
        WHERE t.landlord_id = $1
        ORDER BY t.created_at DESC
      `;
    } else {
      query = `
        SELECT t.*, p.title as property_title, l.name as landlord_name
        FROM transactions t
        JOIN properties p ON t.property_id = p.id
        JOIN users l ON t.landlord_id = l.id
        WHERE t.tenant_id = $1
        ORDER BY t.created_at DESC
      `;
    }

    const result = await pool.query(query, params.length > 0 ? params : []);
    return NextResponse.json({ transactions: result.rows });
  } catch (error: any) {
    console.error('Transactions fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/transactions - Create a transaction (checkout)
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || (user.userType !== 'tenant' && user.userType !== 'buyer')) {
      return NextResponse.json({ error: 'Only tenants/buyers can create transactions' }, { status: 403 });
    }

    const body = await request.json();
    const { propertyId, landlordId, termsAccepted, buyerProtectionLegal, buyerProtectionBgcheck } = body;

    if (!propertyId || !landlordId || !termsAccepted) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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
    const serviceFee = amount * 0.02; // 2% service fee

    // Calculate buyer protection add-ons
    let legalFee = null;
    let bgcheckFee = null;

    if (buyerProtectionLegal) {
      legalFee = property.type === 'lease' ? amount * 0.10 : amount * 0.05;
    }

    if (buyerProtectionBgcheck) {
      bgcheckFee = property.type === 'lease' ? amount * 0.05 : amount * 0.03;
    }

    const result = await pool.query(
      `INSERT INTO transactions (property_id, landlord_id, tenant_id, amount, service_fee,
        buyer_protection_legal, buyer_protection_bgcheck, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'completed')
       RETURNING id, property_id, amount, service_fee, buyer_protection_legal, buyer_protection_bgcheck, status, created_at`,
      [propertyId, landlordId, user.userId, amount, serviceFee, legalFee, bgcheckFee]
    );

    // Update property status
    const newStatus = property.type === 'lease' ? 'leased' : 'sold';
    await pool.query(
      'UPDATE properties SET status = $1, updated_at = NOW() WHERE id = $2',
      [newStatus, propertyId]
    );

    // Send transaction confirmation email
    try {
      const { sendTransactionConfirmationEmail } = await import('@/lib/email/templates');
      await sendTransactionConfirmationEmail({
        email: user.email,
        name: user.email.split('@')[0],
        propertyTitle: property.title || 'Property',
        amount: parseFloat(property.price_naira).toLocaleString(),
        transactionRef: result.rows[0].id.slice(0, 8),
      });
    } catch (emailErr) {
      console.error('Failed to send transaction email:', emailErr);
    }

    return NextResponse.json({
      message: 'Transaction completed successfully',
      transaction: result.rows[0],
      warnings: (!buyerProtectionLegal && !buyerProtectionBgcheck) ? 
        ['You declined buyer protection. Please carry out proper due diligence on your own using legal practitioners to avoid fraud.'] : [],
    }, { status: 201 });
  } catch (error: any) {
    console.error('Transaction creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}