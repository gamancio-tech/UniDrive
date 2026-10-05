import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authLimiter } from "../middlewares/rateLimiter.middleware";

export const authRoutes = Router();

authRoutes.post("/admins/login", authLimiter, authController.loginAdmin);
authRoutes.post("/drivers/login", authLimiter, authController.loginDriver);
authRoutes.post("/students/login", authLimiter, authController.loginStudent);
