-- Drop existing transfer order tables and recreate them properly
DROP TABLE IF EXISTS transfer_stock_movements CASCADE;
DROP TABLE IF EXISTS transfer_order_approvals CASCADE;
DROP TABLE IF EXISTS transfer_order_items CASCADE;
DROP TABLE IF EXISTS transfer_orders CASCADE;

-- Create transfer_orders table without requested_by column
CREATE TABLE transfer_orders (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    order_number text NOT NULL,
    from_warehouse_id uuid NOT NULL REFERENCES warehouses(id),
    to_warehouse_id uuid NOT NULL REFERENCES warehouses(id),
    status text DEFAULT 'PENDING' NOT NULL CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED')),
    priority text DEFAULT 'NORMAL' NOT NULL CHECK (priority IN ('LOW', 'NORMAL', 'HIGH', 'URGENT')),
    approved_by uuid REFERENCES users(id),
    approved_at timestamp without time zone,
    rejection_reason text,
    expected_transfer_date date,
    actual_transfer_date timestamp without time zone,
    completed_at timestamp without time zone,
    notes text,
    total_items integer DEFAULT 0,
    total_value numeric(12,2) DEFAULT 0.00,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT different_warehouses CHECK ((from_warehouse_id <> to_warehouse_id)),
    CONSTRAINT transfer_orders_order_number_key UNIQUE (order_number),
    CONSTRAINT transfer_orders_pkey PRIMARY KEY (id)
);

-- Create transfer_order_items table
CREATE TABLE transfer_order_items (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    transfer_order_id uuid NOT NULL REFERENCES transfer_orders(id) ON DELETE CASCADE,
    inventory_id uuid NOT NULL REFERENCES inventory(id),
    quantity_requested numeric(12,3) NOT NULL CHECK ((quantity_requested > (0)::numeric)),
    quantity_approved numeric(12,3) DEFAULT 0 CHECK ((quantity_approved >= (0)::numeric)),
    quantity_transferred numeric(12,3) DEFAULT 0 CHECK ((quantity_transferred >= (0)::numeric)),
    unit_cost numeric(12,2) DEFAULT 0.00,
    batch_number text,
    expiry_date date,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    CONSTRAINT transfer_order_items_pkey PRIMARY KEY (id)
);

-- Create transfer_order_approvals table
CREATE TABLE transfer_order_approvals (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    transfer_order_id uuid NOT NULL REFERENCES transfer_orders(id) ON DELETE CASCADE,
    approver_id uuid NOT NULL REFERENCES users(id),
    approval_level integer DEFAULT 1 CHECK ((approval_level >= 1) AND (approval_level <= 5)),
    status text NOT NULL CHECK ((status = ANY (ARRAY['PENDING'::text, 'APPROVED'::text, 'REJECTED'::text]))),
    comments text,
    approved_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT transfer_order_approvals_pkey PRIMARY KEY (id),
    CONSTRAINT transfer_order_approvals_transfer_order_id_approver_id_appr_key UNIQUE (transfer_order_id, approver_id, approval_level)
);

-- Create transfer_stock_movements table
CREATE TABLE transfer_stock_movements (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    transfer_order_id uuid NOT NULL REFERENCES transfer_orders(id),
    transfer_order_item_id uuid NOT NULL REFERENCES transfer_order_items(id),
    from_warehouse_id uuid NOT NULL REFERENCES warehouses(id),
    to_warehouse_id uuid NOT NULL REFERENCES warehouses(id),
    inventory_id uuid NOT NULL REFERENCES inventory(id),
    quantity numeric(12,3) NOT NULL,
    movement_type text DEFAULT 'TRANSFER_OUT' NOT NULL CHECK ((movement_type = ANY (ARRAY['TRANSFER_OUT'::text, 'TRANSFER_IN'::text]))),
    batch_number text,
    expiry_date date,
    reference_number text,
    created_by uuid NOT NULL REFERENCES users(id),
    created_at timestamp without time zone DEFAULT now(),
    CONSTRAINT transfer_stock_movements_pkey PRIMARY KEY (id)
);

-- Create indexes
CREATE INDEX idx_transfer_orders_status ON transfer_orders(status);
CREATE INDEX idx_transfer_orders_warehouses ON transfer_orders(from_warehouse_id, to_warehouse_id);
CREATE INDEX idx_transfer_orders_date ON transfer_orders(created_at);
CREATE INDEX idx_transfer_items_order ON transfer_order_items(transfer_order_id);
CREATE INDEX idx_transfer_items_inventory ON transfer_order_items(inventory_id);
CREATE INDEX idx_transfer_approvals_order ON transfer_order_approvals(transfer_order_id);
CREATE INDEX idx_transfer_movements_order ON transfer_stock_movements(transfer_order_id);

-- Create trigger function for order number generation
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

-- Create trigger for automatic order number generation
CREATE TRIGGER trigger_set_transfer_order_number
    BEFORE INSERT ON transfer_orders
    FOR EACH ROW
    WHEN (NEW.order_number IS NULL)
    EXECUTE FUNCTION generate_transfer_order_number();

-- Create trigger function for updating totals
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

-- Create trigger for updating totals
CREATE TRIGGER trigger_update_transfer_totals
    AFTER INSERT OR DELETE OR UPDATE ON transfer_order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_transfer_order_totals();
