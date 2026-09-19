import { Router } from "express";
import { authController } from "../controllers/auth.controller";

export const authRoutes = Router();

authRoutes.post("/drivers/register", authController.registerDriver);
authRoutes.post("/drivers/login", authController.loginDriver);
authRoutes.post("/students/login", authController.loginStudent);
