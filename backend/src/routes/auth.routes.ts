import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authLimiter } from "../middlewares/rateLimiter.middleware";
import { validate } from "../middlewares/validate.middleware";
import { loginSchema } from "../schemas";
import { forgotPasswordSchema, resetPasswordSchema } from "../schemas/auth.schema";

export const authRoutes = Router();

authRoutes.post("/admins/login", authLimiter, validate(loginSchema), authController.loginAdmin);
authRoutes.post("/drivers/login", authLimiter, validate(loginSchema), authController.loginDriver);
authRoutes.post("/students/login", authLimiter, validate(loginSchema), authController.loginStudent);

authRoutes.post("/forgot-password", authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
authRoutes.post("/reset-password", authLimiter, validate(resetPasswordSchema), authController.resetPassword);
