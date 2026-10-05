import { Request, Response, NextFunction } from "express";
import { studentWeeklyScheduleService } from "../services/studentWeeklySchedule.service";
import { StatusCodeHttp } from "../utils/statusCodeHttp";

export const studentWeeklyScheduleController = {
  /** GET /api/students/me/weekly-schedule (retorna a rotina semanal do aluno logado) */
  async getMySchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.id;
      const schedule = await studentWeeklyScheduleService.getSchedule(studentId);
      res.status(StatusCodeHttp.OK).json(schedule);
    } catch (err) {
      next(err);
    }
  },

  /** PUT /api/students/me/weekly-schedule (salva a rotina semanal do aluno logado) */
  async updateMySchedule(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.id;
      const { schedules } = req.body;
      const updated = await studentWeeklyScheduleService.updateSchedule(studentId, schedules);
      res.status(StatusCodeHttp.OK).json({
        message: "Rotina semanal atualizada com sucesso!",
        schedules: updated,
      });
    } catch (err) {
      next(err);
    }
  },
};
