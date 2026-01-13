-- Enhanced Inventory Management System Database Schema
-- PostgreSQL Database with advanced features

-- Create database (run this separately if needed)
-- CREATE DATABASE ims_db;
-- \c ims_db;

-- Enable UUID extension for future use
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table with enhanced role-based access
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'warehouse_staff' CHECK (role IN ('admin', 'inventory_manager', 'warehouse_staff')),
    phone VARCHAR(20),
    department VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    two_factor_enabled BOOLEAN DEFAULT FALSE,
    two_factor_secret VARCHAR(32),
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table for inventory categorization
CREATE TABLE IF NOT EXISTS categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    parent_category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Units of measure table
CREATE TABLE IF NOT EXISTS units_of_measure (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    abbreviation VARCHAR(10) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    manager_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Locations within warehouses (aisles, bins, shelves)
CREATE TABLE IF NOT EXISTS locations (
    id SERIAL PRIMARY KEY,
    warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255),
    location_type VARCHAR(20) DEFAULT 'bin' CHECK (location_type IN ('warehouse', 'zone', 'aisle', 'shelf', 'bin')),
    parent_location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    capacity INTEGER,
    current_capacity INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(warehouse_id, code)
);

-- Suppliers table with enhanced fields
CREATE TABLE IF NOT EXISTS suppliers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE,
    contact_person VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    tax_id VARCHAR(50),
    payment_terms VARCHAR(100),
    lead_time_days INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Supplier pricing tiers
CREATE TABLE IF NOT EXISTS supplier_pricing_tiers (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES inventory(id) ON DELETE CASCADE,
    min_quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    effective_date DATE DEFAULT CURRENT_DATE,
    expiry_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced inventory table
CREATE TABLE IF NOT EXISTS inventory (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(50) UNIQUE NOT NULL,
    barcode VARCHAR(100),
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    description TEXT,
    unit_of_measure_id INTEGER REFERENCES units_of_measure(id) ON DELETE RESTRICT,
    current_stock INTEGER DEFAULT 0 NOT NULL CHECK (current_stock >= 0),
    reserved_stock INTEGER DEFAULT 0 NOT NULL CHECK (reserved_stock >= 0),
    available_stock INTEGER GENERATED ALWAYS AS (current_stock - reserved_stock) STORED,
    min_stock INTEGER DEFAULT 0 NOT NULL CHECK (min_stock >= 0),
    max_stock INTEGER DEFAULT 0 NOT NULL CHECK (max_stock >= 0),
    safety_stock INTEGER DEFAULT 0 NOT NULL CHECK (safety_stock >= 0),
    reorder_point INTEGER DEFAULT 0 CHECK (reorder_point >= 0),
    reorder_quantity INTEGER DEFAULT 0 CHECK (reorder_quantity >= 0),
    unit_cost DECIMAL(10,2) DEFAULT 0.00 NOT NULL CHECK (unit_cost >= 0),
    unit_price DECIMAL(10,2) DEFAULT 0.00 NOT NULL CHECK (unit_price >= 0),
    lead_time_days INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    requires_batch_tracking BOOLEAN DEFAULT FALSE,
    requires_serial_tracking BOOLEAN DEFAULT FALSE,
    has_expiry BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock levels by location
CREATE TABLE IF NOT EXISTS stock_levels (
    id SERIAL PRIMARY KEY,
    inventory_id INTEGER REFERENCES inventory(id) ON DELETE CASCADE,
    location_id INTEGER REFERENCES locations(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 0 NOT NULL CHECK (quantity >= 0),
    reserved_quantity INTEGER DEFAULT 0 NOT NULL CHECK (reserved_quantity >= 0),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(inventory_id, location_id)
);

-- Batch/Lot tracking table
CREATE TABLE IF NOT EXISTS batches (
    id SERIAL PRIMARY KEY,
    inventory_id INTEGER REFERENCES inventory(id) ON DELETE CASCADE,
    batch_number VARCHAR(100) NOT NULL,
    manufacture_date DATE,
    expiry_date DATE,
    initial_quantity INTEGER NOT NULL,
    current_quantity INTEGER NOT NULL CHECK (current_quantity >= 0),
    cost_per_unit DECIMAL(10,2),
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Serial numbers table
CREATE TABLE IF NOT EXISTS serial_numbers (
    id SERIAL PRIMARY KEY,
    inventory_id INTEGER REFERENCES inventory(id) ON DELETE CASCADE,
    batch_id INTEGER REFERENCES batches(id) ON DELETE SET NULL,
    serial_number VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'sold', 'damaged', 'returned')),
    location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    manufacture_date DATE,
    expiry_date DATE,
    cost DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(inventory_id, serial_number)
);

-- Purchase requisitions
CREATE TABLE IF NOT EXISTS purchase_requisitions (
    id SERIAL PRIMARY KEY,
    requisition_number VARCHAR(50) UNIQUE NOT NULL,
    requested_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    department VARCHAR(100),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    total_amount DECIMAL(12,2) DEFAULT 0.00,
    request_date DATE DEFAULT CURRENT_DATE,
    required_date DATE,
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_date TIMESTAMP,
    rejection_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchase requisition items
CREATE TABLE IF NOT EXISTS purchase_requisition_items (
    id SERIAL PRIMARY KEY,
    requisition_id INTEGER REFERENCES purchase_requisitions(id) ON DELETE CASCADE,
    inventory_id INTEGER REFERENCES inventory(id) ON DELETE RESTRICT,
    quantity_requested INTEGER NOT NULL CHECK (quantity_requested > 0),
    quantity_approved INTEGER DEFAULT 0 CHECK (quantity_approved >= 0),
    estimated_unit_price DECIMAL(10,2),
    total_estimated_price DECIMAL(12,2) GENERATED ALWAYS AS (quantity_requested * estimated_unit_price) STORED,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchase orders with approval workflow
CREATE TABLE IF NOT EXISTS purchase_orders (
    id SERIAL PRIMARY KEY,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    requisition_id INTEGER REFERENCES purchase_requisitions(id) ON DELETE SET NULL,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE RESTRICT,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'sent', 'partially_received', 'received', 'cancelled')),
    approval_status VARCHAR(20) DEFAULT 'pending' CHECK (approval_status IN ('pending', 'inventory_manager_approved', 'admin_approved', 'rejected')),
    total_amount DECIMAL(12,2) DEFAULT 0.00,
    order_date DATE DEFAULT CURRENT_DATE,
    expected_date DATE,
    sent_date DATE,
    received_date DATE,
    terms_and_conditions TEXT,
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    inventory_manager_approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    inventory_manager_approved_date TIMESTAMP,
    admin_approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    admin_approved_date TIMESTAMP,
    rejected_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    rejected_date TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchase order items
CREATE TABLE IF NOT EXISTS purchase_order_items (
    id SERIAL PRIMARY KEY,
    purchase_order_id INTEGER REFERENCES purchase_orders(id) ON DELETE CASCADE,
    inventory_id INTEGER REFERENCES inventory(id) ON DELETE RESTRICT,
    quantity_ordered INTEGER NOT NULL CHECK (quantity_ordered > 0),
    quantity_received INTEGER DEFAULT 0 CHECK (quantity_received >= 0),
    unit_price DECIMAL(10,2) NOT NULL CHECK (unit_price >= 0),
    total_price DECIMAL(12,2) GENERATED ALWAYS AS (quantity_ordered * unit_price) STORED,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Goods Receipt Notes (GRN)
CREATE TABLE IF NOT EXISTS goods_receipt_notes (
    id SERIAL PRIMARY KEY,
    grn_number VARCHAR(50) UNIQUE NOT NULL,
    purchase_order_id INTEGER REFERENCES purchase_orders(id) ON DELETE RESTRICT,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE RESTRICT,
    received_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    received_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'verified', 'approved', 'rejected')),
    total_items INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GRN items with batch/serial capture
CREATE TABLE IF NOT EXISTS grn_items (
    id SERIAL PRIMARY KEY,
    grn_id INTEGER REFERENCES goods_receipt_notes(id) ON DELETE CASCADE,
    purchase_order_item_id INTEGER REFERENCES purchase_order_items(id) ON DELETE RESTRICT,
    inventory_id INTEGER REFERENCES inventory(id) ON DELETE RESTRICT,
    quantity_accepted INTEGER NOT NULL CHECK (quantity_accepted > 0),
    quantity_rejected INTEGER DEFAULT 0 CHECK (quantity_rejected >= 0),
    batch_number VARCHAR(100),
    manufacture_date DATE,
    expiry_date DATE,
    unit_price DECIMAL(10,2),
    location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transfer orders between warehouses
CREATE TABLE IF NOT EXISTS transfer_orders (
    id SERIAL PRIMARY KEY,
    transfer_number VARCHAR(50) UNIQUE NOT NULL,
    from_warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE RESTRICT,
    to_warehouse_id INTEGER REFERENCES warehouses(id) ON DELETE RESTRICT,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'in_transit', 'received', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    transfer_date DATE DEFAULT CURRENT_DATE,
    expected_date DATE,
    notes TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_date TIMESTAMP,
    received_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    received_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transfer order items
CREATE TABLE IF NOT EXISTS transfer_order_items (
    id SERIAL PRIMARY KEY,
    transfer_order_id INTEGER REFERENCES transfer_orders(id) ON DELETE CASCADE,
    inventory_id INTEGER REFERENCES inventory(id) ON DELETE RESTRICT,
    from_location_id INTEGER REFERENCES locations(id) ON DELETE RESTRICT,
    to_location_id INTEGER REFERENCES locations(id) ON DELETE RESTRICT,
    quantity_requested INTEGER NOT NULL CHECK (quantity_requested > 0),
    quantity_sent INTEGER DEFAULT 0 CHECK (quantity_sent >= 0),
    quantity_received INTEGER DEFAULT 0 CHECK (quantity_received >= 0),
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced stock movements table
CREATE TABLE IF NOT EXISTS stock_movements (
    id SERIAL PRIMARY KEY,
    inventory_id INTEGER REFERENCES inventory(id) ON DELETE CASCADE,
    location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    batch_id INTEGER REFERENCES batches(id) ON DELETE SET NULL,
    serial_number_id INTEGER REFERENCES serial_numbers(id) ON DELETE SET NULL,
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('in', 'out', 'transfer', 'adjustment', 'return')),
    reference_type VARCHAR(50), -- 'purchase', 'sale', 'transfer', 'adjustment', 'return', etc.
    reference_id INTEGER, -- ID of the related record
    quantity INTEGER NOT NULL,
    unit_cost DECIMAL(10,2),
    notes TEXT,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reorder rules table
CREATE TABLE IF NOT EXISTS reorder_rules (
    id SERIAL PRIMARY KEY,
    inventory_id INTEGER REFERENCES inventory(id) ON DELETE CASCADE,
    rule_type VARCHAR(20) DEFAULT 'min_max' CHECK (rule_type IN ('min_max', 'dynamic', 'manual')),
    min_quantity INTEGER DEFAULT 0 CHECK (min_quantity >= 0),
    max_quantity INTEGER DEFAULT 0 CHECK (max_quantity >= 0),
    reorder_quantity INTEGER DEFAULT 0 CHECK (reorder_quantity >= 0),
    lead_time_days INTEGER DEFAULT 0,
    safety_stock_percentage DECIMAL(5,2) DEFAULT 0.00,
    is_active BOOLEAN DEFAULT TRUE,
    last_calculated TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Auto-generated PO suggestions
CREATE TABLE IF NOT EXISTS po_suggestions (
    id SERIAL PRIMARY KEY,
    inventory_id INTEGER REFERENCES inventory(id) ON DELETE CASCADE,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE SET NULL,
    suggested_quantity INTEGER NOT NULL CHECK (suggested_quantity > 0),
    estimated_unit_price DECIMAL(10,2),
    estimated_total DECIMAL(12,2) GENERATED ALWAYS AS (suggested_quantity * estimated_unit_price) STORED,
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    reason VARCHAR(255),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'converted_to_po')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    alert_type VARCHAR(30) NOT NULL CHECK (alert_type IN ('low_stock', 'out_of_stock', 'overstock', 'expiry_warning', 'expired', 'reorder_suggestion')),
    inventory_id INTEGER REFERENCES inventory(id) ON DELETE CASCADE,
    batch_id INTEGER REFERENCES batches(id) ON DELETE SET NULL,
    location_id INTEGER REFERENCES locations(id) ON DELETE SET NULL,
    severity VARCHAR(10) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    title VARCHAR(255) NOT NULL,
    message TEXT,
    current_value INTEGER,
    threshold_value INTEGER,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMP,
    resolved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit log for tracking changes
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id INTEGER NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Reports table for scheduled reports
CREATE TABLE IF NOT EXISTS scheduled_reports (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    frequency VARCHAR(20) DEFAULT 'weekly' CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly')),
    recipients TEXT[], -- Array of email addresses
    parameters JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    last_run TIMESTAMP,
    next_run TIMESTAMP,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_sku ON inventory(sku);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_active ON inventory(is_active);
CREATE INDEX IF NOT EXISTS idx_stock_levels_inventory ON stock_levels(inventory_id);
CREATE INDEX IF NOT EXISTS idx_stock_levels_location ON stock_levels(location_id);
CREATE INDEX IF NOT EXISTS idx_batches_inventory ON batches(inventory_id);
CREATE INDEX IF NOT EXISTS idx_batches_expiry ON batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_inventory ON serial_numbers(inventory_id);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_status ON serial_numbers(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_grn_purchase_order ON goods_receipt_notes(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_transfer_orders_status ON transfer_orders(status);
CREATE INDEX IF NOT EXISTS idx_stock_movements_inventory ON stock_movements(inventory_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_alerts_type_resolved ON alerts(alert_type, is_resolved);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON audit_log(table_name, record_id);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_warehouses_updated_at BEFORE UPDATE ON warehouses
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_batches_updated_at BEFORE UPDATE ON batches
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_serial_numbers_updated_at BEFORE UPDATE ON serial_numbers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_requisitions_updated_at BEFORE UPDATE ON purchase_requisitions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transfer_orders_updated_at BEFORE UPDATE ON transfer_orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_reorder_rules_updated_at BEFORE UPDATE ON reorder_rules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_po_suggestions_updated_at BEFORE UPDATE ON po_suggestions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger for automatic stock level updates
CREATE OR REPLACE FUNCTION update_stock_levels()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO stock_levels (inventory_id, location_id, quantity)
        VALUES (NEW.inventory_id, NEW.location_id, NEW.quantity)
        ON CONFLICT (inventory_id, location_id) 
        DO UPDATE SET quantity = stock_levels.quantity + NEW.quantity, last_updated = CURRENT_TIMESTAMP;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE stock_levels 
        SET quantity = quantity + (NEW.quantity - OLD.quantity), last_updated = CURRENT_TIMESTAMP
        WHERE inventory_id = NEW.inventory_id AND location_id = NEW.location_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE stock_levels 
        SET quantity = quantity - OLD.quantity, last_updated = CURRENT_TIMESTAMP
        WHERE inventory_id = OLD.inventory_id AND location_id = OLD.location_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Create trigger for stock movements
CREATE TRIGGER trigger_update_stock_levels
    AFTER INSERT OR UPDATE OR DELETE ON stock_movements
    FOR EACH ROW EXECUTE FUNCTION update_stock_levels();

-- Trigger for low stock alerts
CREATE OR REPLACE FUNCTION check_stock_alerts()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if stock is at or below minimum
    IF NEW.current_stock <= NEW.min_stock THEN
        INSERT INTO alerts (alert_type, inventory_id, severity, title, message, current_value, threshold_value)
        VALUES (CASE WHEN NEW.current_stock = 0 THEN 'out_of_stock' ELSE 'low_stock' END,
                NEW.id,
                CASE WHEN NEW.current_stock = 0 THEN 'critical' ELSE 'high' END,
                CASE WHEN NEW.current_stock = 0 THEN 'Out of Stock' ELSE 'Low Stock Alert' END,
                CASE WHEN NEW.current_stock = 0 
                     THEN format('Item %s is out of stock', NEW.name)
                     ELSE format('Item %s has low stock (%s remaining, min: %s)', NEW.name, NEW.current_stock, NEW.min_stock)
                END,
                NEW.current_stock,
                NEW.min_stock);
    END IF;
    
    -- Check for overstock
    IF NEW.current_stock >= NEW.max_stock THEN
        INSERT INTO alerts (alert_type, inventory_id, severity, title, message, current_value, threshold_value)
        VALUES ('overstock', NEW.id, 'medium', 'Overstock Alert',
                format('Item %s is overstocked (%s units, max: %s)', NEW.name, NEW.current_stock, NEW.max_stock),
                NEW.current_stock, NEW.max_stock);
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_check_stock_alerts AFTER UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION check_stock_alerts();

-- Trigger for expiry alerts
CREATE OR REPLACE FUNCTION check_expiry_alerts()
RETURNS TRIGGER AS $$
BEGIN
    -- Check for items expiring within 30 days
    IF NEW.expiry_date IS NOT NULL AND NEW.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN
        INSERT INTO alerts (alert_type, inventory_id, batch_id, severity, title, message)
        VALUES (CASE WHEN NEW.expiry_date <= CURRENT_DATE THEN 'expired' ELSE 'expiry_warning' END,
                NEW.inventory_id,
                NEW.id,
                CASE WHEN NEW.expiry_date <= CURRENT_DATE THEN 'critical' ELSE 'high' END,
                CASE WHEN NEW.expiry_date <= CURRENT_DATE THEN 'Item Expired' ELSE 'Expiry Warning' END,
                CASE WHEN NEW.expiry_date <= CURRENT_DATE 
                     THEN format('Batch %s has expired on %s', NEW.batch_number, NEW.expiry_date)
                     ELSE format('Batch %s expires on %s', NEW.batch_number, NEW.expiry_date)
                END);
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_check_expiry_alerts AFTER INSERT OR UPDATE ON batches
    FOR EACH ROW EXECUTE FUNCTION check_expiry_alerts();

-- Create views for reporting
CREATE OR REPLACE VIEW inventory_details AS
SELECT 
    i.id,
    i.name,
    i.sku,
    i.barcode,
    i.description,
    i.current_stock,
    i.reserved_stock,
    i.available_stock,
    i.min_stock,
    i.max_stock,
    i.safety_stock,
    i.reorder_point,
    i.reorder_quantity,
    i.unit_cost,
    i.unit_price,
    i.lead_time_days,
    i.is_active,
    i.requires_batch_tracking,
    i.requires_serial_tracking,
    i.has_expiry,
    i.created_at,
    i.updated_at,
    c.name as category_name,
    u.name as unit_of_measure,
    s.name as supplier_name,
    CASE 
        WHEN i.current_stock = 0 THEN 'out_of_stock'
        WHEN i.current_stock <= i.min_stock THEN 'low'
        WHEN i.current_stock >= i.max_stock THEN 'high'
        ELSE 'normal'
    END as stock_status,
    (i.current_stock * i.unit_cost) as total_value
FROM inventory i
LEFT JOIN categories c ON i.category_id = c.id
LEFT JOIN units_of_measure u ON i.unit_of_measure_id = u.id
LEFT JOIN supplier_pricing_tiers spt ON i.id = spt.item_id
LEFT JOIN suppliers s ON spt.supplier_id = s.id
WHERE i.is_active = TRUE;

CREATE OR REPLACE VIEW stock_movement_details AS
SELECT 
    sm.id,
    sm.movement_type,
    sm.quantity,
    sm.unit_cost,
    sm.reference_type,
    sm.reference_id,
    sm.notes,
    sm.created_at,
    i.name as item_name,
    i.sku as item_sku,
    l.code as location_code,
    w.name as warehouse_name,
    b.batch_number,
    sn.serial_number,
    u.name as user_name
FROM stock_movements sm
JOIN inventory i ON sm.inventory_id = i.id
LEFT JOIN locations l ON sm.location_id = l.id
LEFT JOIN warehouses w ON l.warehouse_id = w.id
LEFT JOIN batches b ON sm.batch_id = b.id
LEFT JOIN serial_numbers sn ON sm.serial_number_id = sn.id
LEFT JOIN users u ON sm.user_id = u.id
ORDER BY sm.created_at DESC;

CREATE OR REPLACE VIEW purchase_order_details AS
SELECT 
    po.id,
    po.order_number,
    po.status,
    po.approval_status,
    po.total_amount,
    po.order_date,
    po.expected_date,
    s.name as supplier_name,
    u.name as created_by_name,
    im.name as inventory_manager_name,
    admin.name as admin_name,
    COUNT(poi.id) as item_count,
    SUM(poi.quantity_received) as total_received,
    SUM(poi.quantity_ordered) as total_ordered
FROM purchase_orders po
LEFT JOIN suppliers s ON po.supplier_id = s.id
LEFT JOIN users u ON po.created_by = u.id
LEFT JOIN users im ON po.inventory_manager_approved_by = im.id
LEFT JOIN users admin ON po.admin_approved_by = admin.id
LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
GROUP BY po.id, s.name, u.name, im.name, admin_name
ORDER BY po.created_at DESC;
