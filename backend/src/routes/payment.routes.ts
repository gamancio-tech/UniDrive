import { Router } from "express";
import { paymentController } from "../controllers/payment.controller";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { studentIdParamSchema } from "../schemas";

export const paymentRoutes = Router();

paymentRoutes.use(authMiddleware);

paymentRoutes.get("/me", requireRole("student"), paymentController.getCurrentCycle);
paymentRoutes.get("/me/history", requireRole("student"), paymentController.history);
paymentRoutes.post("/me/pay", requireRole("student"), paymentController.requestPayment);
paymentRoutes.patch("/me/reminder", requireRole("student"), paymentController.updateReminderDays);

paymentRoutes.post("/:studentId/pay", requireRole("driver"), validate(studentIdParamSchema), paymentController.confirmPaidByDriver);
paymentRoutes.post("/:studentId/reject", requireRole("driver"), validate(studentIdParamSchema), paymentController.rejectPaymentByDriver);
paymentRoutes.get("/student/:studentId", requireRole("driver"), validate(studentIdParamSchema), paymentController.getStudentPaymentStatus);
