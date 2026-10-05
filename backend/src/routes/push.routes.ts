import { Router } from "express";
import { pushController } from "../controllers/push.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { savePushSubscriptionSchema, unsubscribePushSchema } from "../schemas";

export const pushRoutes = Router();

pushRoutes.get("/public-key", pushController.getPublicKey);
pushRoutes.post("/subscribe", authMiddleware, validate(savePushSubscriptionSchema), pushController.subscribe);
pushRoutes.post("/unsubscribe", authMiddleware, validate(unsubscribePushSchema), pushController.unsubscribe);
pushRoutes.post("/test", authMiddleware, pushController.sendTestNotification);
