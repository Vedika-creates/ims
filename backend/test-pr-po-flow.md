# PR → PO End-to-End Test Plan

## Preconditions
- Database schema updated via `pr_po_workflow_updates.sql`.
- Backend server running.
- Frontend logged in as an Inventory Manager and an Admin (different sessions/tabs).

## 1. Create Inventory Items (if not present)
- Use Inventory UI to create an item with:
  - Current stock = 0 or below reorder_point
  - Supplier assigned
  - Reorder point > 0
  - Safety stock > 0

## 2. Generate Purchase Requisition
- As Inventory Manager:
  - Go to Purchase Requisitions page.
  - Click "Generate Requisitions".
  - Verify a PR appears with status `PENDING`.
  - Verify low‑stock alerts are generated (check Alerts page).

## 3. Approve Purchase Requisition (Inventory Manager)
- As Inventory Manager:
  - Approve the PR.
  - Verify PR status changes to `INWARD_APPROVED`.
  - Verify DRAFT PO(s) are created (one per supplier) and linked via `pr_id`.
  - Verify PO status is `DRAFT`.

## 4. Approve Purchase Order (Admin)
- As Admin:
  - Go to Purchase Orders page.
  - Find the DRAFT PO(s).
  - Approve one or more POs.
  - Verify PO status changes to `APPROVED` and `approved_by` is set.
  - Verify PO approval date is set.

## 5. Verify Alerts
- As Inventory Manager/Admin:
  - Go to Alerts page.
  - Verify low‑stock/critical‑stock alerts are present.
  - Acknowledge/resolve alerts and verify status changes.

## 6. Edge Cases
- Try to approve PR as non‑Inventory Manager → should be blocked.
- Try to approve PO as non‑Admin → should be blocked.
- Create a PR with items from multiple suppliers → verify multiple POs are created, each linked to the same PR.

## 7. Database Checks (optional)
```sql
SELECT pr_number, status, approved_by, approved_at FROM purchase_requisitions;
SELECT po_number, status, approved_by, approved_at, pr_id FROM purchase_orders;
SELECT * FROM inventory_alerts WHERE status = 'ACTIVE';
```

## Expected Outcomes
- PR status flow: PENDING → INWARD_APPROVED
- PO status flow: DRAFT → APPROVED
- Alerts generated for low/critical stock
- Role‑based access enforced
- POs linked back to PRs via pr_id
- approved_by fields correctly populated
