import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db/pool';
import { getAuthUser } from '@/lib/auth-helpers';

// GET /api/properties/[id] - Get property details
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser(request);

    const result = await pool.query(
      `SELECT p.*, u.name as landlord_name, u.phone as landlord_phone, u.email as landlord_email
       FROM properties p
       JOIN users u ON p.landlord_id = u.id
       WHERE p.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    const prop = result.rows[0];

    // Check if user has access to full details (subscribed tenant/buyer or landlord/seller of this property or admin)
    const isOwner = user && (user.userId === prop.landlord_id);
    const isAdmin = user && user.userType === 'admin';
    const isSubscribed = user ? await checkSubscription(user.userId, user.userType) : false;
    const canViewFull = isOwner || isAdmin || isSubscribed;

    const response: any = {
      id: prop.id,
      type: prop.type,
      category: prop.category,
      title: prop.title,
      priceNaira: parseFloat(prop.price_naira),
      photosUrls: prop.photos_urls,
      videosUrls: prop.videos_urls,
      address: prop.address,
      city: prop.city,
      state: prop.state,
      isFeatured: prop.is_featured,
      easeOfBusinessBadge: prop.ease_of_business_badge,
      status: prop.status,
      createdAt: prop.created_at,
      landlordName: prop.landlord_name,
    };

    if (canViewFull) {
      response.description = prop.description;
      response.landlordId = prop.landlord_id;
      response.landlordPhone = prop.landlord_phone;
      response.landlordEmail = prop.landlord_email;
      response.viewingsCount = prop.viewings_count;
    }

    return NextResponse.json({ property: response });
  } catch (error: any) {
    console.error('Property detail error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PATCH /api/properties/[id] - Update property (owner only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    // Verify ownership
    const propResult = await pool.query(
      'SELECT landlord_id FROM properties WHERE id = $1',
      [id]
    );
    if (propResult.rows.length === 0) {
      return NextResponse.json({ error: 'Property not found' }, { status: 404 });
    }
    if (propResult.rows[0].landlord_id !== user.userId && user.userType !== 'admin') {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const body = await request.json();
    const allowedFields = ['title', 'description', 'price_naira', 'category', 'address', 'city', 'state', 'photos_urls', 'videos_urls'];
    
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(body)) {
      const dbKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      if (allowedFields.includes(dbKey)) {
        updates.push(`${dbKey} = $${paramIndex++}`);
        values.push(value);
      }
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const result = await pool.query(
      `UPDATE properties SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return NextResponse.json({
      message: 'Property updated successfully',
      property: result.rows[0],
    });
  } catch (error: any) {
    console.error('Property update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function checkSubscription(userId: string, userType: string): Promise<boolean> {
  try {
    const result = await pool.query(
      `SELECT id FROM subscriptions 
       WHERE user_id = $1 AND user_type = $2 AND status = 'active' 
       AND start_date <= NOW() AND end_date >= NOW()`,
      [userId, userType]
    );
    return result.rows.length > 0;
  } catch {
    return false;
  }
}