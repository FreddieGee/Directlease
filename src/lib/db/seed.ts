import bcrypt from 'bcryptjs';
import pool from './pool';

export async function seedAdmin() {
  try {
    // Check if admin already exists
    const existing = await pool.query(
      "SELECT id FROM users WHERE user_type = 'admin' LIMIT 1"
    );

    if (existing.rows.length > 0) {
      console.log('✅ Admin user already exists');
      return;
    }

    // Create admin user
    const passwordHash = await bcrypt.hash('Administrator_01', 12);
    await pool.query(
      `INSERT INTO users (user_type, email, password_hash, name, verification_status, tc_accepted)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      ['admin', 'admin@directlease.com', passwordHash, 'Admin', 'approved', true]
    );

    console.log('✅ Admin user created (Admin / Administrator_01)');
  } catch (error) {
    console.error('❌ Failed to seed admin user:', error);
  }
}