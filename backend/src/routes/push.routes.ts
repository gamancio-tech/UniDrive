import { Router } from "express";
import { pushController } from "../controllers/push.controller";
import { authMiddleware } from "../middlewares/auth.middleware";

export const pushRoutes = Router();

pushRoutes.get("/public-key", pushController.getPublicKey);
pushRoutes.post("/subscribe", authMiddleware, pushController.subscribe);
pushRoutes.post("/test", authMiddleware, pushController.sendTestNotification);
