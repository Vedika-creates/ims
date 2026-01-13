-- Migration: Create database views for reporting and analytics
-- This migration creates optimized views for common queries and reports

-- Enhanced inventory details view
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
    (i.current_stock * i.unit_cost) as total_value,
    ROUND((i.current_stock::DECIMAL / NULLIF(i.max_stock, 0)) * 100, 2) as stock_percentage,
    CASE 
        WHEN i.current_stock <= i.min_stock THEN i.min_stock - i.current_stock
        ELSE 0
    END as shortage_quantity,
    CASE 
        WHEN i.current_stock >= i.max_stock THEN i.current_stock - i.max_stock
        ELSE 0
    END as overstock_quantity
FROM inventory i
LEFT JOIN categories c ON i.category_id = c.id
LEFT JOIN units_of_measure u ON i.unit_of_measure_id = u.id
LEFT JOIN supplier_pricing_tiers spt ON i.id = spt.item_id
LEFT JOIN suppliers s ON spt.supplier_id = s.id
WHERE i.is_active = TRUE;

-- Stock movement details view
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
    u.name as user_name,
    CASE 
        WHEN sm.movement_type = 'in' THEN 'Stock In'
        WHEN sm.movement_type = 'out' THEN 'Stock Out'
        WHEN sm.movement_type = 'transfer' THEN 'Transfer'
        WHEN sm.movement_type = 'adjustment' THEN 'Adjustment'
        WHEN sm.movement_type = 'return' THEN 'Return'
        ELSE sm.movement_type
    END as movement_description,
    (sm.quantity * sm.unit_cost) as total_cost
FROM stock_movements sm
JOIN inventory i ON sm.inventory_id = i.id
LEFT JOIN locations l ON sm.location_id = l.id
LEFT JOIN warehouses w ON l.warehouse_id = w.id
LEFT JOIN batches b ON sm.batch_id = b.id
LEFT JOIN serial_numbers sn ON sm.serial_number_id = sn.id
LEFT JOIN users u ON sm.user_id = u.id
ORDER BY sm.created_at DESC;

-- Purchase order details view
CREATE OR REPLACE VIEW purchase_order_details AS
SELECT 
    po.id,
    po.order_number,
    po.status,
    po.approval_status,
    po.total_amount,
    po.order_date,
    po.expected_date,
    po.sent_date,
    po.received_date,
    s.name as supplier_name,
    s.code as supplier_code,
    u.name as created_by_name,
    im.name as inventory_manager_name,
    admin.name as admin_name,
    COUNT(poi.id) as item_count,
    SUM(poi.quantity_received) as total_received,
    SUM(poi.quantity_ordered) as total_ordered,
    SUM(poi.quantity_ordered - poi.quantity_received) as pending_quantity,
    ROUND((SUM(poi.quantity_received)::DECIMAL / NULLIF(SUM(poi.quantity_ordered), 0)) * 100, 2) as fulfillment_percentage,
    CASE 
        WHEN po.status = 'received' THEN 'Completed'
        WHEN po.status = 'partially_received' THEN 'Partially Received'
        WHEN po.status = 'sent' THEN 'Sent to Supplier'
        WHEN po.approval_status = 'admin_approved' THEN 'Approved'
        WHEN po.approval_status = 'inventory_manager_approved' THEN 'Pending Admin Approval'
        WHEN po.approval_status = 'rejected' THEN 'Rejected'
        ELSE po.status
    END as status_description
FROM purchase_orders po
LEFT JOIN suppliers s ON po.supplier_id = s.id
LEFT JOIN users u ON po.created_by = u.id
LEFT JOIN users im ON po.inventory_manager_approved_by = im.id
LEFT JOIN users admin ON po.admin_approved_by = admin.id
LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
GROUP BY po.id, s.name, s.code, u.name, im.name, admin.name
ORDER BY po.created_at DESC;

-- Low stock alerts view
CREATE OR REPLACE VIEW low_stock_alerts_view AS
SELECT 
    a.id,
    a.alert_type,
    a.severity,
    a.title,
    a.message,
    a.current_value,
    a.threshold_value,
    a.is_resolved,
    a.created_at,
    i.name as item_name,
    i.sku as item_sku,
    i.current_stock,
    i.min_stock,
    i.max_stock,
    c.name as category_name,
    l.code as location_code,
    w.name as warehouse_name,
    u.name as resolved_by_name
FROM alerts a
JOIN inventory i ON a.inventory_id = i.id
LEFT JOIN categories c ON i.category_id = c.id
LEFT JOIN locations l ON a.location_id = l.id
LEFT JOIN warehouses w ON l.warehouse_id = w.id
LEFT JOIN users u ON a.resolved_by = u.id
WHERE a.alert_type IN ('low_stock', 'out_of_stock', 'overstock')
AND a.is_resolved = FALSE
ORDER BY a.severity DESC, a.created_at DESC;

-- Expiry tracking view
CREATE OR REPLACE VIEW expiry_tracking_view AS
SELECT 
    b.id,
    b.batch_number,
    b.manufacture_date,
    b.expiry_date,
    b.initial_quantity,
    b.current_quantity,
    b.cost_per_unit,
    i.name as item_name,
    i.sku as item_sku,
    c.name as category_name,
    s.name as supplier_name,
    CASE 
        WHEN b.expiry_date <= CURRENT_DATE THEN 'expired'
        WHEN b.expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'expiring_soon'
        WHEN b.expiry_date <= CURRENT_DATE + INTERVAL '90 days' THEN 'expiring_this_quarter'
        ELSE 'good'
    END as expiry_status,
    CURRENT_DATE - b.expiry_date as days_expired,
    b.expiry_date - CURRENT_DATE as days_to_expiry,
    ROUND((b.current_quantity * b.cost_per_unit), 2) as total_value
FROM batches b
JOIN inventory i ON b.inventory_id = i.id
LEFT JOIN categories c ON i.category_id = c.id
LEFT JOIN suppliers s ON b.supplier_id = s.id
WHERE i.has_expiry = TRUE
ORDER BY b.expiry_date ASC;

-- Warehouse stock summary view
CREATE OR REPLACE VIEW warehouse_stock_summary AS
SELECT 
    w.id as warehouse_id,
    w.name as warehouse_name,
    w.code as warehouse_code,
    COUNT(DISTINCT i.id) as unique_items,
    SUM(sl.quantity) as total_quantity,
    COUNT(DISTINCT CASE WHEN sl.quantity > 0 THEN i.id END) as items_with_stock,
    COUNT(DISTINCT CASE WHEN sl.quantity <= i.min_stock THEN i.id END) as low_stock_items,
    SUM(CASE WHEN sl.quantity > 0 THEN (sl.quantity * i.unit_cost) ELSE 0 END) as total_value,
    w.is_active
FROM warehouses w
LEFT JOIN locations l ON w.id = l.warehouse_id AND l.is_active = TRUE
LEFT JOIN stock_levels sl ON l.id = sl.location_id AND sl.quantity > 0
LEFT JOIN inventory i ON sl.inventory_id = i.id AND i.is_active = TRUE
GROUP BY w.id, w.name, w.code, w.is_active
ORDER BY w.name;

-- ABC analysis view (based on annual consumption value)
CREATE OR REPLACE VIEW abc_analysis_view AS
WITH annual_consumption AS (
    SELECT 
        i.id,
        i.name,
        i.sku,
        c.name as category_name,
        COALESCE(SUM(
            CASE 
                WHEN sm.movement_type = 'out' THEN ABS(sm.quantity)
                ELSE 0 
            END
        ), 0) as annual_quantity,
        COALESCE(SUM(
            CASE 
                WHEN sm.movement_type = 'out' THEN ABS(sm.quantity * sm.unit_cost)
                ELSE 0 
            END
        ), 0) as annual_value,
        i.unit_cost
    FROM inventory i
    LEFT JOIN categories c ON i.category_id = c.id
    LEFT JOIN stock_movements sm ON i.id = sm.inventory_id 
        AND sm.created_at >= CURRENT_DATE - INTERVAL '1 year'
        AND sm.movement_type = 'out'
    WHERE i.is_active = TRUE
    GROUP BY i.id, i.name, i.sku, c.name, i.unit_cost
),
total_annual_value AS (
    SELECT SUM(annual_value) as total_value
    FROM annual_consumption
    WHERE annual_value > 0
),
ranked_items AS (
    SELECT 
        ac.*,
        tav.total_value,
        (ac.annual_value / NULLIF(tav.total_value, 0)) * 100 as percentage_of_total,
        ROW_NUMBER() OVER (ORDER BY ac.annual_value DESC) as rank_desc,
        ROW_NUMBER() OVER (ORDER BY ac.annual_value ASC) as rank_asc,
        COUNT(*) OVER () as total_items
    FROM annual_consumption ac
    CROSS JOIN total_annual_value tav
    WHERE ac.annual_value > 0
)
SELECT 
    r.*,
    CASE 
        WHEN r.percentage_of_total >= 80 OR r.rank_desc <= (r.total_items * 0.2) THEN 'A'
        WHEN r.percentage_of_total >= 95 OR r.rank_desc <= (r.total_items * 0.5) THEN 'B'
        ELSE 'C'
    END as abc_category,
    ROUND(SUM(r.annual_value) OVER (PARTITION BY 
        CASE 
            WHEN r.percentage_of_total >= 80 OR r.rank_desc <= (r.total_items * 0.2) THEN 'A'
            WHEN r.percentage_of_total >= 95 OR r.rank_desc <= (r.total_items * 0.5) THEN 'B'
            ELSE 'C'
        END
    ), 2) as category_cumulative_value
FROM ranked_items r
ORDER BY r.annual_value DESC;

-- Supplier performance view
CREATE OR REPLACE VIEW supplier_performance_view AS
SELECT 
    s.id,
    s.name,
    s.code,
    s.lead_time_days,
    COUNT(DISTINCT po.id) as total_orders,
    COUNT(DISTINCT CASE WHEN po.status = 'received' THEN po.id END) as completed_orders,
    COUNT(DISTINCT CASE WHEN po.status IN ('pending', 'sent') THEN po.id END) as pending_orders,
    AVG(po.total_amount) as avg_order_value,
    SUM(po.total_amount) as total_order_value,
    AVG(EXTRACT(DAY FROM (po.received_date - po.order_date))) as avg_delivery_days,
    COUNT(DISTINCT i.id) as unique_items_supplied,
    s.is_active
FROM suppliers s
LEFT JOIN purchase_orders po ON s.id = po.supplier_id
LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
LEFT JOIN inventory i ON poi.inventory_id = i.id
GROUP BY s.id, s.name, s.code, s.lead_time_days, s.is_active
ORDER BY total_order_value DESC;

-- Stock valuation view (FIFO and Weighted Average)
CREATE OR REPLACE VIEW stock_valuation_view AS
SELECT 
    i.id,
    i.name,
    i.sku,
    i.current_stock,
    i.unit_cost as current_unit_cost,
    (i.current_stock * i.unit_cost) as current_valuation,
    COALESCE(fifo.avg_cost, i.unit_cost) as fifo_cost,
    COALESCE((i.current_stock * fifo.avg_cost), (i.current_stock * i.unit_cost)) as fifo_valuation,
    COALESCE(weighted_avg.avg_cost, i.unit_cost) as weighted_avg_cost,
    COALESCE((i.current_stock * weighted_avg.avg_cost), (i.current_stock * i.unit_cost)) as weighted_avg_valuation,
    c.name as category_name
FROM inventory i
LEFT JOIN categories c ON i.category_id = c.id
LEFT JOIN (
    SELECT 
        inventory_id,
        AVG(unit_cost) as avg_cost
    FROM stock_movements 
    WHERE movement_type = 'in' 
    AND created_at >= CURRENT_DATE - INTERVAL '1 year'
    GROUP BY inventory_id
) fifo ON i.id = fifo.inventory_id
LEFT JOIN (
    SELECT 
        sm.inventory_id,
        SUM(sm.quantity * sm.unit_cost) / SUM(sm.quantity) as avg_cost
    FROM stock_movements sm
    WHERE sm.movement_type = 'in' 
    AND sm.quantity > 0
    GROUP BY sm.inventory_id
) weighted_avg ON i.id = weighted_avg.inventory_id
WHERE i.is_active = TRUE AND i.current_stock > 0;
