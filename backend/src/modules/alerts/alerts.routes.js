import { Router } from "express";
import {
  getAllAlerts,
  acknowledgeAlert,
  resolveAlert,
} from "./alerts.controller.js";
import { protect } from "../../middlewares/authMiddleware.js";
import { allowRoles } from "../../middlewares/roleMiddleware.js";

const router = Router();

router.use(protect);

router.get("/", allowRoles("Inventory Manager", "Admin"), getAllAlerts);
router.put("/:id/acknowledge", allowRoles("Inventory Manager", "Admin"), acknowledgeAlert);
router.put("/:id/resolve", allowRoles("Inventory Manager", "Admin"), resolveAlert);

export default router;
