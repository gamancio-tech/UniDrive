import { Router } from "express";
import { announcementController } from "../controllers/announcement.controller";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";

export const announcementRoutes = Router();

announcementRoutes.use(authMiddleware);

announcementRoutes.get("/", announcementController.list);
announcementRoutes.post("/", requireRole("driver"), announcementController.publish);
