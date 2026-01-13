-- Migration: Create purchase order and requisition tables
-- This migration creates tables for purchase order workflow management

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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_requested_by ON purchase_requisitions(requested_by);
CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_status ON purchase_requisitions(status);
CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_items_requisition ON purchase_requisition_items(requisition_id);
CREATE INDEX IF NOT EXISTS idx_purchase_requisitions_items_inventory ON purchase_requisition_items(inventory_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_approval_status ON purchase_orders(approval_status);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_created_by ON purchase_orders(created_by);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_purchase_order ON purchase_order_items(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_purchase_order_items_inventory ON purchase_order_items(inventory_id);
CREATE INDEX IF NOT EXISTS idx_grn_purchase_order ON goods_receipt_notes(purchase_order_id);
CREATE INDEX IF NOT EXISTS idx_grn_supplier ON goods_receipt_notes(supplier_id);
CREATE INDEX IF NOT EXISTS idx_grn_items_grn ON grn_items(grn_id);
CREATE INDEX IF NOT EXISTS idx_grn_items_inventory ON grn_items(inventory_id);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_purchase_requisitions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_purchase_requisitions_updated_at BEFORE UPDATE ON purchase_requisitions
    FOR EACH ROW EXECUTE FUNCTION update_purchase_requisitions_updated_at();

CREATE OR REPLACE FUNCTION update_purchase_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_purchase_orders_updated_at BEFORE UPDATE ON purchase_orders
    FOR EACH ROW EXECUTE FUNCTION update_purchase_orders_updated_at();

CREATE OR REPLACE FUNCTION update_grn_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_grn_updated_at BEFORE UPDATE ON goods_receipt_notes
    FOR EACH ROW EXECUTE FUNCTION update_grn_updated_at();
