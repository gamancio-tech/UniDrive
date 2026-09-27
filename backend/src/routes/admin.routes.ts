import { Router } from "express";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";
import { adminController } from "../controllers/admin.controller";

export const adminRoutes = Router();
adminRoutes.use(authMiddleware, requireRole("admin"));

adminRoutes.post("/admin", adminController.createAdmin);
adminRoutes.post("/driver", adminController.createDriver);
adminRoutes.post("/student", adminController.createStudent);
adminRoutes.get("/list/drivers", adminController.getDrivers);
adminRoutes.get("/list/drivers/:id", adminController.getDriverById);
adminRoutes.get("/list/students", adminController.getStudentByStatus);
adminRoutes.get("/list/students/:id", adminController.getStudentById);
// adminRoutes.delete("/student/:id", adminController.deactivateStudent);
// adminRoutes.delete("/driver/:id", adminController.deactivateDriver);
// adminRoutes.put("/student/:id", adminController.updateStudent);
// adminRoutes.put("/driver/:id", adminController.updateDriver);
