const normalizeRole = (role) => {
  if (!role) return role;

  const normalized = String(role).trim();
  const lower = normalized.toLowerCase();

  if (["admin", "administrator"].includes(lower)) return "Admin";
  if (["inventory manager", "inventory_manager", "inventorymanager"].includes(lower)) {
    return "Inventory Manager";
  }
  if (["warehouse staff", "warehouse_staff", "warehousestaff", "staff"].includes(lower)) {
    return "Warehouse Staff";
  }

  return normalized;
};

export const allowRoles = (...roles) => {
  const allowedRoles = roles.map(normalizeRole);

  return (req, res, next) => {
    const currentRole = normalizeRole(req.user?.role);

    if (!allowedRoles.includes(currentRole)) {
      console.log('🚫 Access denied:', {
        currentRole,
        allowedRoles,
        path: req.originalUrl
      });
      return res.status(403).json({ message: "Access denied" });
    }
    next();
  };
};
