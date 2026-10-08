import { Router } from "express";
import { tripCancellationController } from "../controllers/tripCancellation.controller";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { cancelTripSchema, uncancelTripSchema } from "../schemas";

export const tripCancellationRoutes = Router();

tripCancellationRoutes.use(authMiddleware, requireRole("driver"));
tripCancellationRoutes.post("/", validate(cancelTripSchema), tripCancellationController.cancelToday);
tripCancellationRoutes.delete("/", validate(uncancelTripSchema), tripCancellationController.uncancelToday);
