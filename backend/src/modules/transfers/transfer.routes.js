import { Router } from "express";
import {
  getAllTransferOrders,
  getTransferOrderById,
  createTransferOrder,
  approveTransferOrder,
  rejectTransferOrder,
  startTransfer,
  completeTransfer,
  cancelTransferOrder,
  getTransferStatistics
} from "./transfer.controller.js";
import { protect } from "../../middlewares/authMiddleware.js";

const router = Router();

// Apply authentication middleware to all routes
router.use(protect);

// ✅ GET ALL TRANSFER ORDERS (with filtering and pagination)
router.get("/", getAllTransferOrders);

// ✅ GET TRANSFER ORDER STATISTICS
router.get("/statistics", getTransferStatistics);

// ✅ GET TRANSFER ORDER BY ID
router.get("/:id", getTransferOrderById);

// ✅ CREATE TRANSFER ORDER
router.post("/", createTransferOrder);

// ✅ APPROVE TRANSFER ORDER
router.put("/:id/approve", approveTransferOrder);

// ✅ REJECT TRANSFER ORDER
router.put("/:id/reject", rejectTransferOrder);

// ✅ START TRANSFER
router.put("/:id/start", startTransfer);

// ✅ COMPLETE TRANSFER
router.put("/:id/complete", completeTransfer);

// ✅ CANCEL TRANSFER ORDER
router.put("/:id/cancel", cancelTransferOrder);

export default router;
