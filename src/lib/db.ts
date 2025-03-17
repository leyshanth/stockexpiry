import { Pool } from 'pg';

// Check if we're in a production environment
const isProduction = process.env.NODE_ENV === 'production';

// Create a new pool with a connection timeout and max clients
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  max: 20, // Maximum number of clients
  idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
  connectionTimeoutMillis: 10000, // Return an error after 10 seconds if connection could not be established
});

// Add event listeners for connection issues
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  process.exit(-1);
});

// Test the connection on startup
async function testConnection() {
  try {
    const client = await pool.connect();
    console.log('Database connection test successful');
    client.release();
  } catch (error) {
    console.error('Database connection test failed:', error);
  }
}

// Run the test but don't wait for it
testConnection().catch(console.error);

export default pool; 