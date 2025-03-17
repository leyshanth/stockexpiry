import { Pool } from 'pg';

// Check if we're in a production environment
const isProduction = process.env.NODE_ENV === 'production';

// Create a new pool with shorter timeouts for serverless environments
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  max: 10, // Reduce max clients for serverless
  idleTimeoutMillis: 10000, // Close idle clients after 10 seconds
  connectionTimeoutMillis: 5000, // Return an error after 5 seconds if connection could not be established
  statement_timeout: 5000, // Abort any statement that takes more than 5 seconds
  query_timeout: 5000 // Abort any query that takes more than 5 seconds
});

// Add event listeners for connection issues
pool.on('connect', () => {
  console.log('Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle PostgreSQL client', err);
  // Don't exit process in serverless environment
  if (!isProduction) {
    process.exit(-1);
  }
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