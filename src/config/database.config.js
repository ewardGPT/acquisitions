import 'dotenv/config';
import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

// Configure Neon for different environments
if (process.env.NODE_ENV === 'development') {
  // When using Neon Local, configure for HTTP-only (no websockets)
  neonConfig.fetchEndpoint = process.env.NEON_LOCAL_ENDPOINT || 'http://neon-local:5432/sql';
  
  // Neon Local uses HTTP, not websockets
  neonConfig.useSecureWebSocket = false;
  neonConfig.wsProxy = () => null;
  
  console.log('🔧 Database configured for Neon Local (Development)');
} else {
  console.log('🔧 Database configured for Neon Cloud (Production)');
}

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

export { db, sql };
