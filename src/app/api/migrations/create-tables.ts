import pool from "@/lib/db";

export async function createTables() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Create products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        barcode TEXT NOT NULL,
        item_name TEXT NOT NULL,
        price NUMERIC(10, 2),
        weight TEXT,
        category TEXT,
        image_url TEXT
      )
    `);
    
    // Create expiry_items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS expiry_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        barcode TEXT NOT NULL,
        item_name TEXT NOT NULL,
        price NUMERIC(10, 2),
        weight TEXT,
        category TEXT,
        image_url TEXT,
        quantity INTEGER,
        expiry_date DATE
      )
    `);
    
    await client.query('COMMIT');
    console.log('Tables created successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating tables:', error);
    throw error;
  } finally {
    client.release();
  }
} 