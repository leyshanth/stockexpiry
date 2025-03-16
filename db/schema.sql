-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  store_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  barcode VARCHAR(255) NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2),
  weight VARCHAR(100),
  category VARCHAR(100),
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, barcode)
);

-- Create expiry table
CREATE TABLE IF NOT EXISTS expiry (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  barcode VARCHAR(255) NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  price DECIMAL(10, 2),
  weight VARCHAR(100),
  category VARCHAR(100),
  image_url TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  expiry_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create deleted_expiry table for tracking deleted items
CREATE TABLE IF NOT EXISTS deleted_expiry (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  barcode VARCHAR(255) NOT NULL,
  item_name VARCHAR(255) NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  expiry_date DATE NOT NULL,
  deleted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_user_id ON products(user_id);
CREATE INDEX IF NOT EXISTS idx_products_barcode ON products(barcode);
CREATE INDEX IF NOT EXISTS idx_expiry_user_id ON expiry(user_id);
CREATE INDEX IF NOT EXISTS idx_expiry_expiry_date ON expiry(expiry_date);
CREATE INDEX IF NOT EXISTS idx_deleted_expiry_user_id ON deleted_expiry(user_id); 