-- Create categories table if it doesn't exist
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample categories
INSERT INTO categories (id, name, description) VALUES
  ('cat-001', 'Furniture', 'Office furniture items'),
  ('cat-002', 'Electronics', 'Electronic devices and accessories'),
  ('cat-003', 'Office Supplies', 'General office supplies'),
  ('cat-004', 'Raw Materials', 'Raw materials for production'),
  ('cat-005', 'Tools & Equipment', 'Tools and equipment')
ON CONFLICT (id) DO NOTHING;
