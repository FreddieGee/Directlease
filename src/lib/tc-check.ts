import pool from '@/lib/db/pool';

export async function hasAcceptedTerms(userId: string): Promise<boolean> {
  try {
    const result = await pool.query(
      'SELECT tc_accepted FROM users WHERE id = $1',
      [userId]
    );
    if (result.rows.length === 0) return false;
    return result.rows[0].tc_accepted;
  } catch {
    return false;
  }
}

export async function acceptTerms(userId: string, ipAddress: string): Promise<void> {
  await pool.query(
    'UPDATE users SET tc_accepted = TRUE, updated_at = NOW() WHERE id = $1',
    [userId]
  );
  await pool.query(
    `INSERT INTO terms_acceptance (user_id, ip_address) VALUES ($1, $2)
     ON CONFLICT (user_id) DO UPDATE SET accepted_at = NOW(), ip_address = $2`,
    [userId, ipAddress]
  );
}