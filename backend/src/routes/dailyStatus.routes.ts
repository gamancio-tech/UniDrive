import { Router } from "express";
import { dailyStatusController } from "../controllers/dailyStatus.controller";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { updateDailyStatusSchema } from "../schemas";

export const dailyStatusRoutes = Router();

dailyStatusRoutes.use(authMiddleware);

dailyStatusRoutes.post("/", requireRole("student"), validate(updateDailyStatusSchema), dailyStatusController.setStatus);
dailyStatusRoutes.post("/checkin", requireRole("student"), dailyStatusController.checkInSelf);
dailyStatusRoutes.post("/cancel-boarded", requireRole("student"), dailyStatusController.cancelBoardedSelf);
dailyStatusRoutes.post("/checkin/:studentId", requireRole("driver"), dailyStatusController.checkInByDriver);
dailyStatusRoutes.post("/cancel-boarded/:studentId", requireRole("driver"), dailyStatusController.cancelBoardedByDriver);
dailyStatusRoutes.post("/reset-all", requireRole("driver"), dailyStatusController.resetAllBoarded);
dailyStatusRoutes.post("/trip-state", requireRole("driver"), dailyStatusController.setTripState);
dailyStatusRoutes.get("/missing-count", dailyStatusController.getMissingCount);
