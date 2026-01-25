-- Drop views that reference requested_by column
DROP VIEW IF EXISTS vw_transfer_orders_summary;
DROP VIEW IF EXISTS vw_transfer_orders_with_items;

-- Drop index that references requested_by column
DROP INDEX IF EXISTS idx_transfer_orders_requested_by;
