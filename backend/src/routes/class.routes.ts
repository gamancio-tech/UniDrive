import { Router } from "express";
import { classController } from "../controllers/class.controller";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import { classMutationLimiter } from "../middlewares/rateLimiter.middleware";
import {
  createClassSchema,
  updateClassSchema,
  classIdParamSchema,
} from "../schemas/class.schema";

export const classRoutes = Router();

classRoutes.use(authMiddleware, requireRole("driver"));

classRoutes.get("/", classController.list);
classRoutes.post("/", classMutationLimiter, validate(createClassSchema), classController.create);
classRoutes.put(
  "/:id",
  classMutationLimiter,
  validate(classIdParamSchema),
  validate(updateClassSchema),
  classController.update
);
classRoutes.delete(
  "/:id",
  classMutationLimiter,
  validate(classIdParamSchema),
  classController.delete
);
