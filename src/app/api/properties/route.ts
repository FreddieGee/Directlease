import { NextRequest, NextResponse } from 'next/server';
import pool from '@/lib/db/pool';
import { getAuthUser } from '@/lib/auth-helpers';

// GET /api/properties - Browse properties (public for basic info)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const category = searchParams.get('category');
    const city = searchParams.get('city');
    const state = searchParams.get('state');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const featured = searchParams.get('featured');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    let query = `
      SELECT p.id, p.type, p.category, p.title, p.description, p.price_naira,
             p.photos_urls, p.videos_urls, p.address, p.city, p.state,
             p.status, p.is_featured, p.ease_of_business_badge, p.created_at,
             u.name as landlord_name
      FROM properties p
      JOIN users u ON p.landlord_id = u.id
      WHERE p.status = 'approved'
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (type) {
      query += ` AND p.type = $${paramIndex++}`;
      params.push(type);
    }
    if (category) {
      query += ` AND p.category = $${paramIndex++}`;
      params.push(category);
    }
    if (city) {
      query += ` AND LOWER(p.city) LIKE LOWER($${paramIndex++})`;
      params.push(`%${city}%`);
    }
    if (state) {
      query += ` AND LOWER(p.state) LIKE LOWER($${paramIndex++})`;
      params.push(`%${state}%`);
    }
    if (minPrice) {
      query += ` AND p.price_naira >= $${paramIndex++}`;
      params.push(parseFloat(minPrice));
    }
    if (maxPrice) {
      query += ` AND p.price_naira <= $${paramIndex++}`;
      params.push(parseFloat(maxPrice));
    }
    if (featured === 'true') {
      query += ` AND p.is_featured = TRUE`;
    }

    // Get total count
    const countResult = await pool.query(
      query.replace(/SELECT p\.id.*?FROM/, 'SELECT COUNT(*) FROM'),
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Add ordering and pagination
    query += ` ORDER BY p.is_featured DESC, p.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    const user = getAuthUser(request);
    // Paid subscribers get full details; free users get basic info
    const isSubscribed = user ? await checkSubscription(user.userId, user.userType) : false;

    const properties = result.rows.map(prop => {
      const base = {
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
        createdAt: prop.created_at,
        landlordName: prop.landlord_name,
      };

      if (isSubscribed) {
        return {
          ...base,
          description: prop.description,
          landlordId: prop.landlord_id,
        };
      }

      return base;
    });

    return NextResponse.json({
      properties,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error('Properties fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/properties - Create property listing (landlord/seller only)
export async function POST(request: NextRequest) {
  try {
    const user = getAuthUser(request);
    if (!user || (user.userType !== 'landlord' && user.userType !== 'seller')) {
      return NextResponse.json(
        { error: 'Only landlords and sellers can create listings' },
        { status: 403 }
      );
    }

    // Check verification status
    const verResult = await pool.query(
      'SELECT verification_status FROM users WHERE id = $1',
      [user.userId]
    );
    if (verResult.rows.length === 0 || verResult.rows[0].verification_status !== 'approved') {
      return NextResponse.json(
        { error: 'Your account must be verified before listing properties' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { type, category, title, description, priceNaira, photosUrls, videosUrls, address, city, state } = body;

    // Validate required fields
    if (!type || !category || !title || !description || !priceNaira || !address || !city || !state) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate photos count (minimum 6)
    if (!photosUrls || photosUrls.length < 6) {
      return NextResponse.json(
        { error: 'At least 6 photos are required' },
        { status: 400 }
      );
    }

    // Validate videos count (minimum 2)
    if (!videosUrls || videosUrls.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 videos are required' },
        { status: 400 }
      );
    }

    const result = await pool.query(
      `INSERT INTO properties (landlord_id, type, category, title, description, price_naira, photos_urls, videos_urls, address, city, state)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       RETURNING id, type, category, title, price_naira, status, created_at`,
      [user.userId, type, category, title, description, priceNaira, photosUrls, videosUrls, address, city, state]
    );

    const property = result.rows[0];

    return NextResponse.json({
      message: 'Property listed successfully. Pending admin approval.',
      property: {
        id: property.id,
        type: property.type,
        category: property.category,
        title: property.title,
        priceNaira: parseFloat(property.price_naira),
        status: property.status,
        createdAt: property.created_at,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error('Property creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
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