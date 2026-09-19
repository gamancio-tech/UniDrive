import { Router } from "express";
import { paymentController } from "../controllers/payment.controller";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";

export const paymentRoutes = Router();

paymentRoutes.use(authMiddleware, requireRole("student"));

paymentRoutes.get("/me", paymentController.getCurrentCycle);
paymentRoutes.get("/me/history", paymentController.history);
paymentRoutes.post("/me/pay", paymentController.markPaid);
paymentRoutes.patch("/me/reminder", paymentController.updateReminderDays);
