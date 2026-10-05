import { Router } from "express";
import { authMiddleware, requireRole, requireSuperAdmin } from "../middlewares/auth.middleware";
import { adminController } from "../controllers/admin.controller";
import { validate } from "../middlewares/validate.middleware";
import { createAdminSchema, createDriverSchema, createStudentSchema } from "../schemas";

export const adminRoutes = Router();
adminRoutes.use(authMiddleware, requireRole("admin"));

adminRoutes.post("/admin", requireSuperAdmin, validate(createAdminSchema), adminController.createAdmin);
adminRoutes.get("/list/admins", requireSuperAdmin, adminController.getAdmins);
adminRoutes.delete("/admin/:id", requireSuperAdmin, adminController.deleteAdmin);
adminRoutes.post("/driver", validate(createDriverSchema), adminController.createDriver);
adminRoutes.post("/student", validate(createStudentSchema), adminController.createStudent);
adminRoutes.get("/list/drivers", adminController.getDrivers);
adminRoutes.get("/list/drivers/:id", adminController.getDriverById);
adminRoutes.get("/list/students", adminController.getStudentByStatus);
adminRoutes.get("/list/students/:id", adminController.getStudentById);
adminRoutes.delete("/student/:id", adminController.deactivateStudent);
adminRoutes.delete("/driver/:id", adminController.deactivateDriver);
adminRoutes.patch("/student/reactivate/:id", adminController.reactivateStudent);
adminRoutes.patch("/driver/reactivate/:id", adminController.reactivateDriver);
// adminRoutes.put("/student/:id", adminController.updateStudent);
// adminRoutes.put("/driver/:id", adminController.updateDriver);
