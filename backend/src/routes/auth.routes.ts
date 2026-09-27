import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";

export const authRoutes = Router();

authRoutes.post("/admins/login", authController.loginAdmin);
authRoutes.post("/drivers/register", authMiddleware, requireRole("admin"), authController.registerDriver);
authRoutes.post("/drivers/login", authController.loginDriver);
authRoutes.post("/students/login", authController.loginStudent);
