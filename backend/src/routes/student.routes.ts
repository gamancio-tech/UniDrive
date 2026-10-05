import { Router } from "express";
import { studentController } from "../controllers/student.controller";
import { studentWeeklyScheduleController } from "../controllers/studentWeeklySchedule.controller";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";

export const studentRoutes = Router();

// Todas as rotas abaixo requerem autenticação
studentRoutes.use(authMiddleware);

// Rotas do próprio aluno (Configuração da rotina semanal padrão)
studentRoutes.get("/me/weekly-schedule", requireRole("student"), studentWeeklyScheduleController.getMySchedule);
studentRoutes.put("/me/weekly-schedule", requireRole("student"), studentWeeklyScheduleController.updateMySchedule);

// Rotas de gestão de alunos (exclusivas do motorista)
studentRoutes.post("/", requireRole("driver"), studentController.create);
studentRoutes.get("/", requireRole("driver"), studentController.list);
studentRoutes.patch("/:id/reactivate", requireRole("driver"), studentController.reactivate);
studentRoutes.delete("/:id", requireRole("driver"), studentController.deactivate);
