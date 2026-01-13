-- Drop all tables in correct order (reverse of creation order)
-- Execute this to clean up and start fresh

-- Drop views first
DROP VIEW IF EXISTS inventory_details CASCADE;
DROP VIEW IF EXISTS stock_movement_details CASCADE;
DROP VIEW IF EXISTS purchase_order_details CASCADE;

-- Drop triggers
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
DROP TRIGGER IF EXISTS update_warehouses_updated_at ON warehouses;
DROP TRIGGER IF EXISTS update_locations_updated_at ON locations;
DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
DROP TRIGGER IF EXISTS update_inventory_updated_at ON inventory;
DROP TRIGGER IF EXISTS update_batches_updated_at ON batches;
DROP TRIGGER IF EXISTS update_serial_numbers_updated_at ON serial_numbers;
DROP TRIGGER IF EXISTS update_purchase_requisitions_updated_at ON purchase_requisitions;
DROP TRIGGER IF EXISTS update_purchase_orders_updated_at ON purchase_orders;
DROP TRIGGER IF EXISTS update_transfer_orders_updated_at ON transfer_orders;
DROP TRIGGER IF EXISTS update_reorder_rules_updated_at ON reorder_rules;
DROP TRIGGER IF EXISTS update_po_suggestions_updated_at ON po_suggestions;
DROP TRIGGER IF EXISTS trigger_update_stock_levels ON stock_movements;
DROP TRIGGER IF EXISTS trigger_check_stock_alerts ON inventory;
DROP TRIGGER IF EXISTS trigger_check_expiry_alerts ON batches;

-- Drop functions
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS update_stock_levels() CASCADE;
DROP FUNCTION IF EXISTS check_stock_alerts() CASCADE;
DROP FUNCTION IF EXISTS check_expiry_alerts() CASCADE;

-- Drop tables in reverse order of dependencies
DROP TABLE IF EXISTS scheduled_reports CASCADE;
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS alerts CASCADE;
DROP TABLE IF EXISTS po_suggestions CASCADE;
DROP TABLE IF EXISTS reorder_rules CASCADE;
DROP TABLE IF EXISTS stock_movements CASCADE;
DROP TABLE IF EXISTS transfer_order_items CASCADE;
DROP TABLE IF EXISTS transfer_orders CASCADE;
DROP TABLE IF EXISTS grn_items CASCADE;
DROP TABLE IF EXISTS goods_receipt_notes CASCADE;
DROP TABLE IF EXISTS purchase_order_items CASCADE;
DROP TABLE IF EXISTS purchase_orders CASCADE;
DROP TABLE IF EXISTS purchase_requisition_items CASCADE;
DROP TABLE IF EXISTS purchase_requisitions CASCADE;
DROP TABLE IF EXISTS serial_numbers CASCADE;
DROP TABLE IF EXISTS batches CASCADE;
DROP TABLE IF EXISTS stock_levels CASCADE;
DROP TABLE IF EXISTS supplier_pricing_tiers CASCADE;
DROP TABLE IF EXISTS inventory CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS suppliers CASCADE;
DROP TABLE IF EXISTS warehouses CASCADE;
DROP TABLE IF EXISTS units_of_measure CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Drop indexes (they'll be dropped with tables, but just in case)
DROP INDEX IF EXISTS idx_inventory_sku;
DROP INDEX IF EXISTS idx_inventory_category;
DROP INDEX IF EXISTS idx_inventory_active;
DROP INDEX IF EXISTS idx_stock_levels_inventory;
DROP INDEX IF EXISTS idx_stock_levels_location;
DROP INDEX IF EXISTS idx_batches_inventory;
DROP INDEX IF EXISTS idx_batches_expiry;
DROP INDEX IF EXISTS idx_serial_numbers_inventory;
DROP INDEX IF EXISTS idx_serial_numbers_status;
DROP INDEX IF EXISTS idx_purchase_orders_status;
DROP INDEX IF EXISTS idx_purchase_orders_supplier;
DROP INDEX IF EXISTS idx_grn_purchase_order;
DROP INDEX IF EXISTS idx_transfer_orders_status;
DROP INDEX IF EXISTS idx_stock_movements_inventory;
DROP INDEX IF EXISTS idx_stock_movements_created_at;
DROP INDEX IF EXISTS idx_alerts_type_resolved;
DROP INDEX IF EXISTS idx_audit_log_table_record;
