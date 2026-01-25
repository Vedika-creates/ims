-- Check current inventory-warehouse relationship
SELECT 
    i.id as item_id,
    i.name as item_name,
    i.warehouse_id,
    w.name as warehouse_name,
    i.current_stock,
    i.is_active
FROM inventory i
LEFT JOIN warehouses w ON i.warehouse_id = w.id
ORDER BY i.name
LIMIT 10;

-- Update inventory items to assign them to Main Warehouse if they don't have a warehouse_id
UPDATE inventory 
SET warehouse_id = (SELECT id FROM warehouses WHERE name = 'Main Warehouse' LIMIT 1)
WHERE warehouse_id IS NULL OR warehouse_id = '00000000-0000-0000-0000-000000000000';

-- Verify the update
SELECT 
    COUNT(*) as total_items,
    COUNT(CASE WHEN warehouse_id IS NOT NULL THEN 1 END) as items_with_warehouse,
    COUNT(CASE WHEN warehouse_id IS NULL THEN 1 END) as items_without_warehouse
FROM inventory;
