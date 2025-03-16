import pool from "@/lib/db";

export async function createDeletedTables() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Create deleted_products table
    await client.query(`
      CREATE TABLE IF NOT EXISTS deleted_products (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        barcode TEXT NOT NULL,
        item_name TEXT NOT NULL,
        price NUMERIC(10, 2),
        weight TEXT,
        category TEXT,
        image_url TEXT,
        deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create deleted_expiry_items table
    await client.query(`
      CREATE TABLE IF NOT EXISTS deleted_expiry_items (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        barcode TEXT NOT NULL,
        item_name TEXT NOT NULL,
        price NUMERIC(10, 2),
        weight TEXT,
        category TEXT,
        image_url TEXT,
        quantity INTEGER,
        expiry_date DATE,
        deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await client.query('COMMIT');
    console.log('Deleted items tables created successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating deleted items tables:', error);
    throw error;
  } finally {
    client.release();
  }
} 