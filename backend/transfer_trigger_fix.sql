-- Fix the transfer order trigger
-- Drop the existing trigger and recreate it properly

DROP TRIGGER IF EXISTS trigger_set_transfer_order_number ON transfer_orders;

-- Recreate the trigger function properly
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

-- Recreate the trigger
CREATE TRIGGER trigger_set_transfer_order_number
    BEFORE INSERT ON transfer_orders
    FOR EACH ROW
    WHEN (NEW.order_number IS NULL)
    EXECUTE FUNCTION generate_transfer_order_number();
