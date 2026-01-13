-- Migration: Create automation and alerts tables
-- This migration creates tables for reorder automation, alerts, and reporting

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

-- Supplier pricing tiers
CREATE TABLE IF NOT EXISTS supplier_pricing_tiers (
    id SERIAL PRIMARY KEY,
    supplier_id INTEGER REFERENCES suppliers(id) ON DELETE CASCADE,
    inventory_id INTEGER REFERENCES inventory(id) ON DELETE CASCADE,
    min_quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    effective_date DATE DEFAULT CURRENT_DATE,
    expiry_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reorder_rules_inventory ON reorder_rules(inventory_id);
CREATE INDEX IF NOT EXISTS idx_reorder_rules_active ON reorder_rules(is_active);
CREATE INDEX IF NOT EXISTS idx_po_suggestions_inventory ON po_suggestions(inventory_id);
CREATE INDEX IF NOT EXISTS idx_po_suggestions_supplier ON po_suggestions(supplier_id);
CREATE INDEX IF NOT EXISTS idx_po_suggestions_status ON po_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_alerts_type_resolved ON alerts(alert_type, is_resolved);
CREATE INDEX IF NOT EXISTS idx_alerts_inventory ON alerts(inventory_id);
CREATE INDEX IF NOT EXISTS idx_alerts_batch ON alerts(batch_id);
CREATE INDEX IF NOT EXISTS idx_alerts_location ON alerts(location_id);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts(severity);
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_type ON scheduled_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_active ON scheduled_reports(is_active);
CREATE INDEX IF NOT EXISTS idx_supplier_pricing_tiers_supplier ON supplier_pricing_tiers(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_pricing_tiers_inventory ON supplier_pricing_tiers(inventory_id);

-- Create triggers for updated_at
CREATE OR REPLACE FUNCTION update_reorder_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_reorder_rules_updated_at BEFORE UPDATE ON reorder_rules
    FOR EACH ROW EXECUTE FUNCTION update_reorder_rules_updated_at();

CREATE OR REPLACE FUNCTION update_po_suggestions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_po_suggestions_updated_at BEFORE UPDATE ON po_suggestions
    FOR EACH ROW EXECUTE FUNCTION update_po_suggestions_updated_at();

CREATE OR REPLACE FUNCTION update_scheduled_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_update_scheduled_reports_updated_at BEFORE UPDATE ON scheduled_reports
    FOR EACH ROW EXECUTE FUNCTION update_scheduled_reports_updated_at();

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

-- Audit log trigger function
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, record_id, action, new_values)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_values, new_values)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, record_id, action, old_values)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit triggers for important tables
CREATE TRIGGER audit_inventory_trigger
    AFTER INSERT OR UPDATE OR DELETE ON inventory
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_purchase_orders_trigger
    AFTER INSERT OR UPDATE OR DELETE ON purchase_orders
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_stock_movements_trigger
    AFTER INSERT OR UPDATE OR DELETE ON stock_movements
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_batches_trigger
    AFTER INSERT OR UPDATE OR DELETE ON batches
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
