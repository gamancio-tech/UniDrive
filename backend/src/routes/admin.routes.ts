import { Router } from "express";
import { authMiddleware, requireRole, requireSuperAdmin } from "../middlewares/auth.middleware";
import { adminController } from "../controllers/admin.controller";
import { validate } from "../middlewares/validate.middleware";
import { createAdminSchema, createDriverSchema, createStudentSchema, idParamSchema, statusQuerySchema } from "../schemas";

export const adminRoutes = Router();
adminRoutes.use(authMiddleware, requireRole("admin"));

adminRoutes.post("/admin", requireSuperAdmin, validate(createAdminSchema), adminController.createAdmin);
adminRoutes.get("/list/admins", requireSuperAdmin, adminController.getAdmins);
adminRoutes.delete("/admin/:id", requireSuperAdmin, validate(idParamSchema), adminController.deleteAdmin);
adminRoutes.post("/driver", validate(createDriverSchema), adminController.createDriver);
adminRoutes.post("/student", validate(createStudentSchema), adminController.createStudent);
adminRoutes.get("/list/drivers", adminController.getDrivers);
adminRoutes.get("/list/drivers/:id", validate(idParamSchema), adminController.getDriverById);
adminRoutes.get("/list/students", validate(statusQuerySchema), adminController.getStudentByStatus);
adminRoutes.get("/list/students/:id", validate(idParamSchema), adminController.getStudentById);
adminRoutes.delete("/student/:id", validate(idParamSchema), adminController.deactivateStudent);
adminRoutes.delete("/driver/:id", validate(idParamSchema), adminController.deactivateDriver);
adminRoutes.patch("/student/reactivate/:id", validate(idParamSchema), adminController.reactivateStudent);
adminRoutes.patch("/driver/reactivate/:id", validate(idParamSchema), adminController.reactivateDriver);
// adminRoutes.put("/student/:id", adminController.updateStudent);
// adminRoutes.put("/driver/:id", adminController.updateDriver);
