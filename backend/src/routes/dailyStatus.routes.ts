import { Router } from "express";
import { dailyStatusController } from "../controllers/dailyStatus.controller";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";

export const dailyStatusRoutes = Router();

dailyStatusRoutes.use(authMiddleware);

dailyStatusRoutes.post("/", requireRole("student"), dailyStatusController.setStatus);
dailyStatusRoutes.post("/checkin", requireRole("student"), dailyStatusController.checkInSelf);
dailyStatusRoutes.post("/checkin/:studentId", requireRole("driver"), dailyStatusController.checkInByDriver);
dailyStatusRoutes.get("/missing-count", dailyStatusController.getMissingCount);
