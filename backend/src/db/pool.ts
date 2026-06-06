import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export async function migrate() {
  const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
  await pool.query(sql);
  console.log('Database migrated');
}
