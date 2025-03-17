import { Pool } from 'pg';

let pool: Pool;

try {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });
  
  // Test the connection
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('Database connection error:', err);
    } else {
      console.log('Connected to PostgreSQL database');
    }
  });
} catch (error) {
  console.error('Failed to initialize database pool:', error);
  throw error;
}

export default pool; 