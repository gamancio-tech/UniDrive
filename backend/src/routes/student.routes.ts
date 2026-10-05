import { Router } from "express";
import { studentController } from "../controllers/student.controller";
import { studentWeeklyScheduleController } from "../controllers/studentWeeklySchedule.controller";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate.middleware";
import {
  createStudentByDriverSchema,
  idParamSchema,
  statusQuerySchema,
  updatePhoneSchema,
  updatePhotoSchema,
  updateSchedulesSchema,
} from "../schemas";

export const studentRoutes = Router();

// Todas as rotas abaixo requerem autenticação
studentRoutes.use(authMiddleware);

// Rotas do próprio aluno (Configuração da rotina semanal e perfil/foto/telefone)
studentRoutes.get("/me/profile", requireRole("student"), studentController.getProfile);
studentRoutes.patch("/me/photo", requireRole("student"), validate(updatePhotoSchema), studentController.updatePhoto);
studentRoutes.patch("/me/phone", requireRole("student"), validate(updatePhoneSchema), studentController.updatePhone);
studentRoutes.get("/me/weekly-schedule", requireRole("student"), studentWeeklyScheduleController.getMySchedule);
studentRoutes.put("/me/weekly-schedule", requireRole("student"), validate(updateSchedulesSchema), studentWeeklyScheduleController.updateMySchedule);

// Rotas de gestão de alunos (exclusivas do motorista)
studentRoutes.post("/", requireRole("driver"), validate(createStudentByDriverSchema), studentController.create);
studentRoutes.get("/", requireRole("driver"), validate(statusQuerySchema), studentController.list);
studentRoutes.patch("/:id/phone", requireRole("driver"), validate(idParamSchema), validate(updatePhoneSchema), studentController.updatePhone);
studentRoutes.patch("/:id/reactivate", requireRole("driver"), validate(idParamSchema), studentController.reactivate);
studentRoutes.delete("/:id", requireRole("driver"), validate(idParamSchema), studentController.deactivate);
