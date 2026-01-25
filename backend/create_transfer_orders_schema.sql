-- Transfer Orders Schema
-- This schema manages inter-warehouse inventory transfers with approval workflow

-- Main transfer orders table
CREATE TABLE IF NOT EXISTS transfer_orders (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    order_number text UNIQUE NOT NULL,
    from_warehouse_id uuid NOT NULL REFERENCES warehouses(id),
    to_warehouse_id uuid NOT NULL REFERENCES warehouses(id),
    status text DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED')),
    priority text DEFAULT 'NORMAL' CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    requested_by uuid NOT NULL REFERENCES users(id),
    approved_by uuid REFERENCES users(id),
    approved_at timestamp without time zone,
    rejection_reason text,
    expected_transfer_date date,
    actual_transfer_date timestamp without time zone,
    completed_at timestamp without time zone,
    notes text,
    total_items integer DEFAULT 0,
    total_value decimal(12,2) DEFAULT 0.00,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    PRIMARY KEY (id),
    CONSTRAINT different_warehouses CHECK (from_warehouse_id != to_warehouse_id)
);

-- Transfer order line items
CREATE TABLE IF NOT EXISTS transfer_order_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    transfer_order_id uuid NOT NULL REFERENCES transfer_orders(id) ON DELETE CASCADE,
    inventory_id uuid NOT NULL REFERENCES inventory(id),
    quantity_requested numeric(12,3) NOT NULL CHECK (quantity_requested > 0),
    quantity_approved numeric(12,3) CHECK (quantity_approved >= 0),
    quantity_transferred numeric(12,3) DEFAULT 0 CHECK (quantity_transferred >= 0),
    unit_cost decimal(12,2) DEFAULT 0.00,
    batch_number text,
    expiry_date date,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    PRIMARY KEY (id)
);

-- Transfer order approvals workflow
CREATE TABLE IF NOT EXISTS transfer_order_approvals (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    transfer_order_id uuid NOT NULL REFERENCES transfer_orders(id) ON DELETE CASCADE,
    approver_id uuid NOT NULL REFERENCES users(id),
    approval_level integer DEFAULT 1 CHECK (approval_level >= 1 AND approval_level <= 5),
    status text NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    comments text,
    approved_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    PRIMARY KEY (id),
    UNIQUE (transfer_order_id, approver_id, approval_level)
);

-- Stock movements for transfer orders
CREATE TABLE IF NOT EXISTS transfer_stock_movements (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    transfer_order_id uuid NOT NULL REFERENCES transfer_orders(id),
    transfer_order_item_id uuid NOT NULL REFERENCES transfer_order_items(id),
    from_warehouse_id uuid NOT NULL REFERENCES warehouses(id),
    to_warehouse_id uuid NOT NULL REFERENCES warehouses(id),
    inventory_id uuid NOT NULL REFERENCES inventory(id),
    quantity numeric(12,3) NOT NULL,
    movement_type text DEFAULT 'TRANSFER_OUT' CHECK (movement_type IN ('TRANSFER_OUT', 'TRANSFER_IN')),
    batch_number text,
    expiry_date date,
    reference_number text,
    created_by uuid NOT NULL REFERENCES users(id),
    created_at timestamp without time zone DEFAULT now(),
    PRIMARY KEY (id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_transfer_orders_status ON transfer_orders(status);
CREATE INDEX IF NOT EXISTS idx_transfer_orders_warehouses ON transfer_orders(from_warehouse_id, to_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_transfer_orders_requested_by ON transfer_orders(requested_by);
CREATE INDEX IF NOT EXISTS idx_transfer_orders_date ON transfer_orders(created_at);
CREATE INDEX IF NOT EXISTS idx_transfer_items_order ON transfer_order_items(transfer_order_id);
CREATE INDEX IF NOT EXISTS idx_transfer_items_inventory ON transfer_order_items(inventory_id);
CREATE INDEX IF NOT EXISTS idx_transfer_approvals_order ON transfer_order_approvals(transfer_order_id);
CREATE INDEX IF NOT EXISTS idx_transfer_movements_order ON transfer_stock_movements(transfer_order_id);

-- Create views for common queries
CREATE OR REPLACE VIEW vw_transfer_orders_summary AS
SELECT 
    to.*,
    fw.name as from_warehouse_name,
    tw.name as to_warehouse_name,
    req_user.name as requested_by_name,
    req_user.email as requested_by_email,
    app_user.name as approved_by_name,
    CASE 
        WHEN to.status = 'PENDING' THEN 'Waiting for approval'
        WHEN to.status = 'APPROVED' THEN 'Approved - Ready for transfer'
        WHEN to.status = 'REJECTED' THEN 'Rejected'
        WHEN to.status = 'IN_TRANSIT' THEN 'In transit'
        WHEN to.status = 'COMPLETED' THEN 'Completed'
        WHEN to.status = 'CANCELLED' THEN 'Cancelled'
    END as status_display,
    CASE 
        WHEN to.expected_transfer_date < CURRENT_DATE AND to.status IN ('PENDING', 'APPROVED') THEN true
        ELSE false
    END as is_overdue
FROM transfer_orders to
LEFT JOIN warehouses fw ON to.from_warehouse_id = fw.id
LEFT JOIN warehouses tw ON to.to_warehouse_id = tw.id
LEFT JOIN users req_user ON to.requested_by = req_user.id
LEFT JOIN users app_user ON to.approved_by = app_user.id;

CREATE OR REPLACE VIEW vw_transfer_orders_with_items AS
SELECT 
    to.*,
    fw.name as from_warehouse_name,
    tw.name as to_warehouse_name,
    req_user.name as requested_by_name,
    app_user.name as approved_by_name,
    COALESCE(
        json_agg(
            json_build_object(
                'item_id', toi.inventory_id,
                'item_name', i.name,
                'item_sku', i.sku,
                'quantity_requested', toi.quantity_requested,
                'quantity_approved', toi.quantity_approved,
                'quantity_transferred', toi.quantity_transferred,
                'unit_cost', toi.unit_cost,
                'total_cost', toi.quantity_requested * toi.unit_cost,
                'batch_number', toi.batch_number,
                'expiry_date', toi.expiry_date,
                'notes', toi.notes
            )
        ) FILTER (WHERE toi.id IS NOT NULL),
        '[]'::json
    ) as items
FROM transfer_orders to
LEFT JOIN warehouses fw ON to.from_warehouse_id = fw.id
LEFT JOIN warehouses tw ON to.to_warehouse_id = tw.id
LEFT JOIN users req_user ON to.requested_by = req_user.id
LEFT JOIN users app_user ON to.approved_by = app_user.id
LEFT JOIN transfer_order_items toi ON to.id = toi.transfer_order_id
LEFT JOIN inventory i ON toi.inventory_id = i.id
GROUP BY to.id, fw.name, tw.name, req_user.name, app_user.name;

-- Function to generate transfer order numbers
CREATE OR REPLACE FUNCTION generate_transfer_order_number()
RETURNS TRIGGER AS $$
DECLARE
    order_num text;
    month_part text;
    year_part text;
    seq_num integer;
BEGIN
    month_part := to_char(current_date, 'MM');
    year_part := to_char(current_date, 'YY');
    
    -- Get next sequence for this month/year
    SELECT COALESCE(MAX(CAST(SUBSTRING(order_number FROM '[0-9]+$') AS integer)), 0) + 1
    INTO seq_num
    FROM transfer_orders
    WHERE order_number LIKE 'TO-' || year_part || month_part || '-%';
    
    order_num := 'TO-' || year_part || month_part || '-' || LPAD(seq_num::text, 4, '0');
    
    NEW.order_number := order_num;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update transfer order totals
CREATE OR REPLACE FUNCTION update_transfer_order_totals()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' OR TG_OP = 'DELETE' THEN
        UPDATE transfer_orders 
        SET 
            total_items = (
                SELECT COUNT(*) 
                FROM transfer_order_items 
                WHERE transfer_order_id = COALESCE(NEW.transfer_order_id, OLD.transfer_order_id)
            ),
            total_value = (
                SELECT COALESCE(SUM(quantity_requested * unit_cost), 0)
                FROM transfer_order_items 
                WHERE transfer_order_id = COALESCE(NEW.transfer_order_id, OLD.transfer_order_id)
            ),
            updated_at = now()
        WHERE id = COALESCE(NEW.transfer_order_id, OLD.transfer_order_id);
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers
CREATE TRIGGER trigger_update_transfer_totals
    AFTER INSERT OR UPDATE OR DELETE ON transfer_order_items
    FOR EACH ROW EXECUTE FUNCTION update_transfer_order_totals();

-- Trigger to set order number on insert
CREATE TRIGGER trigger_set_transfer_order_number
    BEFORE INSERT ON transfer_orders
    FOR EACH ROW
    WHEN (NEW.order_number IS NULL)
    EXECUTE FUNCTION generate_transfer_order_number();

-- Function to handle stock updates for transfers
CREATE OR REPLACE FUNCTION process_transfer_stock_movement(
    p_transfer_order_id uuid,
    p_inventory_id uuid,
    p_from_warehouse_id uuid,
    p_to_warehouse_id uuid,
    p_quantity numeric,
    p_movement_type text,
    p_created_by uuid,
    p_batch_number text DEFAULT NULL,
    p_expiry_date date DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    -- Create stock movement record
    INSERT INTO transfer_stock_movements (
        transfer_order_id,
        transfer_order_item_id,
        from_warehouse_id,
        to_warehouse_id,
        inventory_id,
        quantity,
        movement_type,
        batch_number,
        expiry_date,
        created_by
    ) VALUES (
        p_transfer_order_id,
        (SELECT id FROM transfer_order_items WHERE transfer_order_id = p_transfer_order_id AND inventory_id = p_inventory_id LIMIT 1),
        p_from_warehouse_id,
        p_to_warehouse_id,
        p_inventory_id,
        p_quantity,
        p_movement_type,
        p_batch_number,
        p_expiry_date,
        p_created_by
    );
    
    -- Update inventory stock levels (this would need to be implemented based on your stock management system)
    -- For now, this is a placeholder that would integrate with your existing stock management
END;
$$ LANGUAGE plpgsql;

-- Insert sample data for testing
INSERT INTO transfer_orders (
    order_number, from_warehouse_id, to_warehouse_id, status, requested_by, 
    expected_transfer_date, notes
) VALUES
(
    'TO-2401001',
    (SELECT id FROM warehouses LIMIT 1),
    (SELECT id FROM warehouses OFFSET 1 LIMIT 1),
    'PENDING',
    '16b98519-3557-41c1-8619-164c03f612da',
    CURRENT_DATE + INTERVAL '3 days',
    'Urgent transfer needed for customer order'
) ON CONFLICT (order_number) DO NOTHING;

-- Add sample transfer order items
INSERT INTO transfer_order_items (
    transfer_order_id, inventory_id, quantity_requested, unit_cost, batch_number
) 
SELECT 
    (SELECT id FROM transfer_orders WHERE order_number = 'TO-2401001'),
    id,
    10,
    COALESCE(unit_cost, 50.00),
    'BATCH-001'
FROM inventory 
WHERE is_active = true 
LIMIT 2
ON CONFLICT DO NOTHING;
