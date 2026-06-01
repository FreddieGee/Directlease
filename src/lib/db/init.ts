import fs from 'fs';
import path from 'path';
import pool from './pool';

export async function initializeDatabase() {
  try {
    const schemaPath = path.join(process.cwd(), 'src', 'lib', 'db', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    
    await pool.query(schema);
    console.log('Database schema initialized successfully');
  } catch (error) {
    console.error('Error initializing database schema:', error);
    throw error;
  }
}

export default pool;