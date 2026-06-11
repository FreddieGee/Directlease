import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db/pool';
import { getAuthUser } from '@/lib/auth-helpers';

// GET /api/verification - Get user's verification status
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    let result;
    if (user.userType === 'landlord' || user.userType === 'seller') {
      result = await pool.query(
        'SELECT * FROM landlord_verification_docs WHERE user_id = $1',
        [user.userId]
      );
    } else {
      result = await pool.query(
        'SELECT * FROM tenant_verification_docs WHERE user_id = $1',
        [user.userId]
      );
    }

    return NextResponse.json({
      verification: result.rows[0] || null,
      status: (await pool.query('SELECT verification_status FROM users WHERE id = $1', [user.userId])).rows[0].verification_status,
    });
  } catch (error: any) {
    console.error('Verification fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/verification - Submit verification documents
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();

    if (user.userType === 'landlord' || user.userType === 'seller') {
      const { nin, homeAddress, utilityBillUrl, ninSlipUrl, profilePicUrl } = body;
      
      if (!nin || !homeAddress || !utilityBillUrl || !ninSlipUrl || !profilePicUrl) {
        return NextResponse.json({ error: 'All verification documents are required' }, { status: 400 });
      }

      await pool.query(
        `INSERT INTO landlord_verification_docs (user_id, nin, home_address, utility_bill_url, nin_slip_url, profile_pic_url)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (user_id) DO UPDATE SET
           nin = $2, home_address = $3, utility_bill_url = $4, nin_slip_url = $5, profile_pic_url = $6,
           status = 'pending', admin_notes = NULL, updated_at = NOW()`,
        [user.userId, nin, homeAddress, utilityBillUrl, ninSlipUrl, profilePicUrl]
      );
    } else {
      const { nin, phone, profilePicUrl, email } = body;
      
      if (!nin || !phone || !profilePicUrl || !email) {
        return NextResponse.json({ error: 'All verification information is required' }, { status: 400 });
      }

      await pool.query(
        `INSERT INTO tenant_verification_docs (user_id, nin, phone, profile_pic_url, email)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (user_id) DO UPDATE SET
           nin = $2, phone = $3, profile_pic_url = $4, email = $5,
           status = 'pending', admin_notes = NULL, updated_at = NOW()`,
        [user.userId, nin, phone, profilePicUrl, email]
      );
    }

    // Notify admin about pending verification
    try {
      const { sendAdminVerificationPendingEmail } = await import('@/lib/email/templates');
      await sendAdminVerificationPendingEmail({
        userName: user.email.split('@')[0],
        userEmail: user.email,
        userType: user.userType,
      });
    } catch (emailErr) {
      console.error('Failed to send admin verification notification:', emailErr);
    }

    return NextResponse.json({
      message: 'Verification documents submitted. Awaiting admin review.',
    }, { status: 201 });
  } catch (error: any) {
    console.error('Verification submission error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}