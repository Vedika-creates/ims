-- Migration: Create batch/serial tracking and stock movement tables
-- This migration creates tables for tracking inventory movements and batch/serial numbers

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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(inventory_id, batch_number)
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

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_batches_inventory ON batches(inventory_id);
CREATE INDEX IF NOT EXISTS idx_batches_expiry ON batches(expiry_date);
CREATE INDEX IF NOT EXISTS idx_batches_supplier ON batches(supplier_id);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_inventory ON serial_numbers(inventory_id);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_batch ON serial_numbers(batch_id);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_status ON serial_numbers(status);
CREATE INDEX IF NOT EXISTS idx_serial_numbers_location ON serial_numbers(location_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_inventory ON stock_movements(inventory_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_location ON stock_movements(location_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_batch ON stock_movements(batch_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_serial ON stock_movements(serial_number_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_transfer_orders_from_warehouse ON transfer_orders(from_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_transfer_orders_to_warehouse ON transfer_orders(to_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_transfer_orders_status ON transfer_orders(status);
CREATE INDEX IF NOT EXISTS idx_transfer_order_items_transfer_order ON transfer_order_items(transfer_order_id);
CREATE INDEX IF NOT EXISTS idx_transfer_order_items_inventory ON transfer_order_items(inventory_id);
CREATE INDEX IF NOT EXISTS idx_transfer_order_items_from_location ON transfer_order_items(from_location_id);
CREATE INDEX IF NOT EXISTS idx_transfer_order_items_to_location ON transfer_order_items(to_location_id);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_batches_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_batches_updated_at BEFORE UPDATE ON batches
    FOR EACH ROW EXECUTE FUNCTION update_batches_updated_at();

CREATE OR REPLACE FUNCTION update_serial_numbers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_serial_numbers_updated_at BEFORE UPDATE ON serial_numbers
    FOR EACH ROW EXECUTE FUNCTION update_serial_numbers_updated_at();

CREATE OR REPLACE FUNCTION update_transfer_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_transfer_orders_updated_at BEFORE UPDATE ON transfer_orders
    FOR EACH ROW EXECUTE FUNCTION update_transfer_orders_updated_at();

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
