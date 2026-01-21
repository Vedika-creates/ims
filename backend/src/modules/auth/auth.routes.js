import { Router } from "express";
import { login, register } from "./auth.controller.js";
import { protect } from "../../middlewares/authMiddleware.js";
import { allowRoles } from "../../middlewares/roleMiddleware.js";

const router = Router();

router.post("/login", login);
router.post("/register", protect, allowRoles("ADMIN"), register);

export default router;
