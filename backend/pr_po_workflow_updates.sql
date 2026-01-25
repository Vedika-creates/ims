-- PR/PO workflow + alerts schema updates
-- Run manually against your database when ready.

-- 1) Normalize existing role values to UI-friendly labels
ALTER TABLE users
  DROP CONSTRAINT IF EXISTS users_role_check;

UPDATE users SET role = 'Admin' WHERE role IN ('ADMIN', 'Administrator', 'administrator');
UPDATE users SET role = 'Inventory Manager' WHERE role IN ('INVENTORY_MANAGER', 'inventory_manager', 'inventory manager');
UPDATE users SET role = 'Warehouse Staff' WHERE role IN ('WAREHOUSE_STAFF', 'STAFF', 'staff', 'warehouse_staff');

ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN ('Admin', 'Inventory Manager', 'Warehouse Staff'));

-- 2) Update purchase requisition status values
ALTER TABLE purchase_requisitions
  DROP CONSTRAINT IF EXISTS purchase_requisitions_status_check;

UPDATE purchase_requisitions
SET status = CASE
  WHEN status IN ('APPROVED', 'approved', 'Approved', 'INWARD_APPROVED', 'inward_approved', 'Inward_Approved') THEN 'INWARD_APPROVED'
  WHEN status IN ('REJECTED', 'rejected', 'Rejected') THEN 'REJECTED'
  WHEN status IN ('PENDING', 'pending', 'Pending') THEN 'PENDING'
  ELSE status
END;

ALTER TABLE purchase_requisitions
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES users(id),
  ADD COLUMN IF NOT EXISTS approved_at timestamp without time zone;

ALTER TABLE purchase_requisitions
  ADD CONSTRAINT purchase_requisitions_status_check
  CHECK (status IN ('PENDING', 'INWARD_APPROVED', 'REJECTED'));

-- 3) Link purchase orders back to requisitions
ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS pr_id uuid;

ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES users(id);

ALTER TABLE purchase_orders
  ADD COLUMN IF NOT EXISTS approved_at timestamp without time zone;

CREATE INDEX IF NOT EXISTS idx_purchase_orders_pr_id ON purchase_orders(pr_id);

ALTER TABLE purchase_orders
  DROP CONSTRAINT IF EXISTS purchase_orders_status_check;

ALTER TABLE purchase_orders
  ADD CONSTRAINT purchase_orders_status_check
  CHECK (status IN ('DRAFT', 'APPROVED', 'CANCELLED'));

-- 4) Alerts table for low stock / critical stock / system alerts
CREATE TABLE IF NOT EXISTS inventory_alerts (
  id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
  item_id uuid REFERENCES inventory(id),
  alert_type text NOT NULL CHECK (alert_type IN ('LOW_STOCK', 'CRITICAL_STOCK', 'OVERSTOCK', 'EXPIRY', 'SYSTEM')),
  severity text NOT NULL CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'INFO')),
  status text NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'ACKNOWLEDGED', 'RESOLVED')),
  title text,
  message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  triggered_at timestamp without time zone DEFAULT now(),
  acknowledged_at timestamp without time zone,
  acknowledged_by uuid REFERENCES users(id),
  resolved_at timestamp without time zone,
  resolved_by uuid REFERENCES users(id),
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp without time zone DEFAULT now(),
  PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_alerts_status ON inventory_alerts(status);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_type ON inventory_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_inventory_alerts_item ON inventory_alerts(item_id);
