import { pool } from "../../config/db.js";

const ALERT_SELECT = `
  SELECT
    ia.id,
    ia.alert_type,
    ia.severity,
    ia.status,
    ia.title,
    ia.message,
    ia.metadata,
    ia.triggered_at,
    ia.acknowledged_at,
    ia.resolved_at,
    ia.created_at,
    ia.updated_at,
    i.name as item_name,
    i.sku,
    i.current_stock,
    i.reorder_point,
    i.safety_stock,
    w.name as warehouse_name,
    ack_user.name as acknowledged_by_name,
    res_user.name as resolved_by_name
  FROM inventory_alerts ia
  LEFT JOIN inventory i ON i.id = ia.item_id
  LEFT JOIN warehouses w ON w.id = i.warehouse_id
  LEFT JOIN users ack_user ON ack_user.id = ia.acknowledged_by
  LEFT JOIN users res_user ON res_user.id = ia.resolved_by
`;

const resolveUserId = async (req) => {
  if (req.user?.userId) {
    return req.user.userId;
  }

  const userResult = await pool.query(
    "SELECT id FROM users WHERE is_active = true LIMIT 1"
  );

  if (userResult.rows.length === 0) {
    throw new Error("No active users found in the system");
  }

  return userResult.rows[0].id;
};

const getAlertById = async (id) => {
  const result = await pool.query(
    `${ALERT_SELECT}
     WHERE ia.id = $1`,
    [id]
  );

  return result.rows[0];
};

const normalizeAlertType = (type) => {
  if (!type) return type;

  const normalized = String(type).trim().toUpperCase();
  const map = {
    LOW_STOCK: "LOW_STOCK",
    CRITICAL_STOCK: "CRITICAL_STOCK",
    OVERSTOCK: "OVERSTOCK",
    EXPIRY_WARNING: "EXPIRY",
    EXPIRY: "EXPIRY",
    SYSTEM: "SYSTEM",
  };

  return map[normalized] || normalized;
};

export const getAllAlerts = async (req, res) => {
  try {
    const conditions = [];
    const values = [];

    if (req.query.status) {
      values.push(String(req.query.status).trim().toUpperCase());
      conditions.push(`ia.status = $${values.length}`);
    }

    if (req.query.type) {
      values.push(normalizeAlertType(req.query.type));
      conditions.push(`ia.alert_type = $${values.length}`);
    }

    const whereClause = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const result = await pool.query(
      `${ALERT_SELECT}
       ${whereClause}
       ORDER BY ia.triggered_at DESC`,
      values
    );

    res.json(result.rows);
  } catch (error) {
    console.error("Error fetching alerts:", error);
    res.status(500).json({ error: "Failed to fetch alerts" });
  }
};

export const acknowledgeAlert = async (req, res) => {
  const { id } = req.params;

  try {
    const userId = await resolveUserId(req);
    const updateResult = await pool.query(
      `UPDATE inventory_alerts
       SET status = 'ACKNOWLEDGED',
           acknowledged_at = NOW(),
           acknowledged_by = $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING id`,
      [userId, id]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: "Alert not found" });
    }

    const alert = await getAlertById(id);
    res.json(alert);
  } catch (error) {
    console.error("Error acknowledging alert:", error);
    res.status(500).json({ error: "Failed to acknowledge alert" });
  }
};

export const resolveAlert = async (req, res) => {
  const { id } = req.params;

  try {
    const userId = await resolveUserId(req);
    const updateResult = await pool.query(
      `UPDATE inventory_alerts
       SET status = 'RESOLVED',
           resolved_at = NOW(),
           resolved_by = $1,
           updated_at = NOW()
       WHERE id = $2
       RETURNING id`,
      [userId, id]
    );

    if (updateResult.rows.length === 0) {
      return res.status(404).json({ error: "Alert not found" });
    }

    const alert = await getAlertById(id);
    res.json(alert);
  } catch (error) {
    console.error("Error resolving alert:", error);
    res.status(500).json({ error: "Failed to resolve alert" });
  }
};
