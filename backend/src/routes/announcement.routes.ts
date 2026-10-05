import { Router } from "express";
import { announcementController } from "../controllers/announcement.controller";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { publishAnnouncementSchema } from "../schemas";

export const announcementRoutes = Router();

announcementRoutes.use(authMiddleware);

announcementRoutes.get("/", announcementController.list);
announcementRoutes.post("/", requireRole("driver"), validate(publishAnnouncementSchema), announcementController.publish);
