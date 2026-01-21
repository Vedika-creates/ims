import { pool } from './src/config/db.js';
import { hash } from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

async function seedData() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Insert categories
    await client.query(`
      INSERT INTO categories (id, name, description) VALUES
      ($1, 'Electronics', 'Electronic components and devices'),
      ($2, 'Office Supplies', 'Stationery and office equipment'),
      ($3, 'Raw Materials', 'Raw materials for production')
      ON CONFLICT (id) DO NOTHING
    `, [uuidv4(), uuidv4(), uuidv4()]);
    
    // Get category IDs
    const catResult = await client.query('SELECT id, name FROM categories ORDER BY name');
    const categories = catResult.rows;
    
    // Insert units of measure
    await client.query(`
      INSERT INTO units_of_measure (id, name, symbol) VALUES
      ($1, 'Pieces', 'pcs'),
      ($2, 'Kilograms', 'kg'),
      ($3, 'Liters', 'L'),
      ($4, 'Meters', 'm')
      ON CONFLICT (id) DO NOTHING
    `, [uuidv4(), uuidv4(), uuidv4(), uuidv4()]);
    
    // Get UOM IDs
    const uomResult = await client.query('SELECT id, symbol FROM units_of_measure ORDER BY symbol');
    const uoms = uomResult.rows;
    
    // Insert warehouses
    await client.query(`
      INSERT INTO warehouses (id, name) VALUES
      ($1, 'Main Warehouse'),
      ($2, 'Secondary Warehouse')
      ON CONFLICT (id) DO NOTHING
    `, [uuidv4(), uuidv4()]);
    
    // Insert suppliers
    const supplierIds = [uuidv4(), uuidv4(), uuidv4()];
    await client.query(`
      INSERT INTO suppliers (id, name, contact_person, email, phone, lead_time_days) VALUES
      ($1, 'Tech Supplies Inc.', 'John Smith', 'john@techsupplies.com', '555-0101', 7),
      ($2, 'Office Depot', 'Sarah Johnson', 'sarah@officedepot.com', '555-0102', 3),
      ($3, 'Materials Co.', 'Mike Wilson', 'mike@materials.com', '555-0103', 14)
      ON CONFLICT (id) DO NOTHING
    `, supplierIds);
    
    // Insert items
    const electronicsCat = categories.find(c => c.name === 'Electronics');
    const officeCat = categories.find(c => c.name === 'Office Supplies');
    const rawCat = categories.find(c => c.name === 'Raw Materials');
    const pcsUom = uoms.find(u => u.symbol === 'pcs');
    const kgUom = uoms.find(u => u.symbol === 'kg');
    
    const itemIds = [uuidv4(), uuidv4(), uuidv4(), uuidv4()];
    await client.query(`
      INSERT INTO items (id, sku, name, description, category_id, uom_id, lead_time_days, safety_stock, reorder_point) VALUES
      ($1, 'LAP-001', 'Laptop Computer', 'Business laptop', $2, $3, 14, 10, 20),
      ($4, 'PEN-001', 'Ballpoint Pen', 'Blue ballpoint pen', $5, $6, 7, 100, 200),
      ($7, 'STEEL-001', 'Steel Rod', 'Steel rod for manufacturing', $8, $9, 21, 50, 100),
      ($10, 'PAPER-001', 'A4 Paper', 'A4 size paper pack', $11, $12, 5, 20, 50)
      ON CONFLICT (id) DO NOTHING
    `, [
      itemIds[0], electronicsCat.id, pcsUom.id,
      itemIds[1], officeCat.id, pcsUom.id,
      itemIds[2], rawCat.id, kgUom.id,
      itemIds[3], officeCat.id, pcsUom.id
    ]);
    
    // Insert sample purchase order
    const poId = uuidv4();
    await client.query(`
      INSERT INTO purchase_orders (id, po_number, supplier_id, status, created_by) VALUES
      ($1, 'PO-2026-001', $2, 'APPROVED', '16b98519-3557-41c1-8619-164c03f612da')
      ON CONFLICT (id) DO NOTHING
    `, [poId, supplierIds[0]]);
    
    // Insert purchase order items
    await client.query(`
      INSERT INTO purchase_order_items (id, po_id, item_id, quantity) VALUES
      ($1, $2, $3, 10),
      ($4, $5, $6, 50)
      ON CONFLICT (id) DO NOTHING
    `, [uuidv4(), poId, itemIds[0], uuidv4(), poId, itemIds[1]]);
    
    await client.query('COMMIT');
    console.log('✅ Sample data seeded successfully');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding data:', error);
  } finally {
    client.release();
  }
}

seedData().then(() => process.exit(0));
