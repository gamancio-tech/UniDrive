import { Router } from "express";
import { studentController } from "../controllers/student.controller";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";

export const studentRoutes = Router();

studentRoutes.use(authMiddleware, requireRole("driver"));

studentRoutes.post("/", studentController.create);
studentRoutes.get("/", studentController.list);
studentRoutes.delete("/:id", studentController.deactivate);
