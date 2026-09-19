import { Router } from "express";
import { tripCancellationController } from "../controllers/tripCancellation.controller";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";

export const tripCancellationRoutes = Router();

tripCancellationRoutes.use(authMiddleware, requireRole("driver"));
tripCancellationRoutes.post("/", tripCancellationController.cancelToday);
