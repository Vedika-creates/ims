-- Sample Data for Inventory Management System
-- Execute this after schema is created

-- Insert Users
INSERT INTO users (name, email, password, role, phone, department) VALUES
('Admin User', 'admin@ims.com', 'admin123', 'admin', '123-456-7890', 'IT'),
('John Smith', 'john.smith@ims.com', 'password123', 'inventory_manager', '123-456-7891', 'Warehouse'),
('Jane Doe', 'jane.doe@ims.com', 'password123', 'warehouse_staff', '123-456-7892', 'Warehouse'),
('Mike Johnson', 'mike.johnson@ims.com', 'password123', 'warehouse_staff', '123-456-7893', 'Receiving');

-- Insert Categories
INSERT INTO categories (name, description) VALUES
('Electronics', 'Electronic devices and components'),
('Office Supplies', 'Office and stationery items'),
('Furniture', 'Office furniture and fixtures'),
('Raw Materials', 'Raw materials for production'),
('Tools', 'Tools and equipment'),
('Safety Equipment', 'Safety and protective gear');

-- Insert Units of Measure
INSERT INTO units_of_measure (name, abbreviation, description) VALUES
('Pieces', 'pcs', 'Individual items'),
('Boxes', 'box', 'Boxed items'),
('Kilograms', 'kg', 'Weight measurement'),
('Liters', 'L', 'Volume measurement'),
('Meters', 'm', 'Length measurement'),
('Sets', 'set', 'Set of items');

-- Insert Warehouses
INSERT INTO warehouses (name, code, address, city, state, country, postal_code, manager_id) VALUES
('Main Warehouse', 'WH001', '123 Storage Lane', 'New York', 'NY', 'USA', '10001', 2),
('Secondary Warehouse', 'WH002', '456 Logistics Road', 'Los Angeles', 'CA', 'USA', '90001', 2);

-- Insert Locations
INSERT INTO locations (warehouse_id, code, name, location_type, capacity) VALUES
(1, 'A-01', 'Aisle A - Bin 01', 'bin', 1000),
(1, 'A-02', 'Aisle A - Bin 02', 'bin', 1000),
(1, 'B-01', 'Aisle B - Bin 01', 'bin', 500),
(2, 'C-01', 'Aisle C - Bin 01', 'bin', 800),
(2, 'C-02', 'Aisle C - Bin 02', 'bin', 800);

-- Insert Suppliers
INSERT INTO suppliers (name, code, contact_person, email, phone, address, city, state, country, postal_code, lead_time_days) VALUES
('Tech Supplies Inc', 'SUP001', 'Tom Wilson', 'tom@techsupplies.com', '555-0101', '789 Tech Blvd', 'San Francisco', 'CA', 'USA', '94102', 7),
('Office Depot', 'SUP002', 'Sarah Lee', 'sarah@officedepot.com', '555-0102', '321 Stationery Ave', 'Chicago', 'IL', 'USA', '60601', 3),
('Furniture Plus', 'SUP003', 'Bob Brown', 'bob@furnitureplus.com', '555-0103', '654 Furniture St', 'Boston', 'MA', 'USA', '02101', 14);

-- Insert Sample Inventory Items
INSERT INTO inventory (name, sku, barcode, category_id, description, unit_of_measure_id, current_stock, min_stock, max_stock, unit_cost, unit_price, lead_time_days) VALUES
('Laptop Computer', 'LAP001', '1234567890123', 1, '15-inch business laptop', 1, 50, 10, 100, 800.00, 1200.00, 7),
('Office Chair', 'CHR001', '2345678901234', 3, 'Ergonomic office chair', 1, 25, 5, 50, 150.00, 250.00, 14),
('Printer Paper', 'PAP001', '3456789012345', 2, 'A4 printer paper ream', 2, 200, 50, 500, 8.00, 15.00, 3),
('Safety Helmet', 'HEL001', '4567890123456', 6, 'Construction safety helmet', 1, 100, 20, 200, 25.00, 45.00, 5),
('Screwdriver Set', 'TOO001', '5678901234567', 5, 'Professional screwdriver set', 6, 30, 10, 60, 35.00, 65.00, 10);

-- Insert Stock Levels
INSERT INTO stock_levels (inventory_id, location_id, quantity) VALUES
(1, 1, 30),
(1, 2, 20),
(2, 3, 15),
(2, 4, 10),
(3, 1, 100),
(3, 5, 100),
(4, 2, 60),
(4, 5, 40),
(5, 3, 20),
(5, 4, 10);

-- Insert Sample Purchase Order
INSERT INTO purchase_orders (order_number, supplier_id, status, total_amount, order_date, expected_date, created_by) VALUES
('PO-2024-001', 1, 'approved', 40000.00, CURRENT_DATE, CURRENT_DATE + INTERVAL '7 days', 1);

-- Insert Purchase Order Items
INSERT INTO purchase_order_items (purchase_order_id, inventory_id, quantity_ordered, unit_price) VALUES
(1, 1, 10, 800.00),
(1, 2, 5, 150.00);

-- Insert Sample Stock Movement
INSERT INTO stock_movements (inventory_id, location_id, movement_type, reference_type, reference_id, quantity, unit_cost, user_id, notes) VALUES
(1, 1, 'in', 'purchase', 1, 10, 800.00, 3, 'Initial stock from PO-2024-001'),
(2, 3, 'in', 'purchase', 1, 5, 150.00, 3, 'Initial stock from PO-2024-001');
