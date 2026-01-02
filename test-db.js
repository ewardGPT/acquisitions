import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function testConnection() {
  try {
    console.log('Testing database connection...');
    const result = await sql`SELECT * FROM users LIMIT 1`;
    console.log('✅ Connection successful!');
    console.log('Result:', result);
  } catch (error) {
    console.error('❌ Connection failed:', error);
  }
}

testConnection();
