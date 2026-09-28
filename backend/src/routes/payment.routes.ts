import { Router } from "express";
import { paymentController } from "../controllers/payment.controller";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";

export const paymentRoutes = Router();

paymentRoutes.use(authMiddleware);

paymentRoutes.get("/me", requireRole("student"), paymentController.getCurrentCycle);
paymentRoutes.get("/me/history", requireRole("student"), paymentController.history);
paymentRoutes.post("/me/pay", requireRole("student"), paymentController.markPaid);
paymentRoutes.patch("/me/reminder", requireRole("student"), paymentController.updateReminderDays);

paymentRoutes.post("/:studentId/pay", requireRole("driver"), paymentController.markPaidByDriver);
paymentRoutes.get("/student/:studentId", requireRole("driver"), paymentController.getStudentPaymentStatus);
