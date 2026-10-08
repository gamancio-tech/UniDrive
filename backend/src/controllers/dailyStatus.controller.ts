import { NextFunction, Request, Response } from "express";
import { dailyStatusService } from "../services/dailyStatus.service";
import { dailyStatusRepository } from "../repositories/dailyStatus.repository";
import { StatusCodeHttp } from "../utils/statusCodeHttp";
import { hasRole } from "../utils/roles";
import { studentWeeklyScheduleService } from "../services/studentWeeklySchedule.service";
import { studentService } from "../services/student.service";

function toDateOnly(date: Date): Date {
  return new Date(date.toISOString().slice(0, 10));
}

export const dailyStatusController = {
  /** RF01 — POST /api/daily-status */
  async setStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.id;
      const { status, date } = req.body;
      const updated = await dailyStatusService.setStatus(studentId, new Date(date ?? Date.now()), status);
      res.status(StatusCodeHttp.OK).json(updated);
    } catch (err) {
      next(err);
    }
  },

  /** RF04 — POST /api/daily-status/checkin (aluno marca o próprio embarque) */
  async checkInSelf(req: Request, res: Response, next: NextFunction) {
    try {
      if (!hasRole(req.user!, "student")) {
        return res.status(StatusCodeHttp.FORBIDDEN).json({ error: "Apenas alunos podem marcar o próprio embarque" });
      }
      const studentId = req.user.id;
      const driverId = req.user.driverId;
      const updated = await dailyStatusService.checkIn(studentId, new Date(), driverId);
      res.status(StatusCodeHttp.OK).json(updated);
    } catch (err) {
      next(err);
    }
  },

  /** RF04 — POST /api/daily-status/cancel-boarded (aluno cancela o próprio embarque) */
  async cancelBoardedSelf(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.id;
      const updated = await dailyStatusService.cancelBoarded(studentId, new Date());
      res.status(StatusCodeHttp.OK).json(updated);
    } catch (err) {
      next(err);
    }
  },

  /** RF04 — POST /api/daily-status/checkin/:studentId (motorista marca por um aluno) */
  async checkInByDriver(req: Request, res: Response, next: NextFunction) {
    try {
      if (!hasRole(req.user!, "driver")) {
        return res.status(StatusCodeHttp.FORBIDDEN).json({ error: "Apenas motoristas podem realizar essa ação" });
      }
      const driverId = req.user.id;
      const { studentId } = req.params;
      await studentService.assertBelongsToDriver(studentId, driverId);
      const updated = await dailyStatusService.checkIn(studentId, new Date(), driverId);
      res.status(StatusCodeHttp.OK).json(updated);
    } catch (err) {
      next(err);
    }
  },

  /** RF04 — POST /api/daily-status/cancel-boarded/:studentId (motorista desfaz embarque de um aluno) */
  async cancelBoardedByDriver(req: Request, res: Response, next: NextFunction) {
    try {
      if (!hasRole(req.user!, "driver")) {
        return res.status(StatusCodeHttp.FORBIDDEN).json({ error: "Apenas motoristas podem realizar essa ação" });
      }
      const { studentId } = req.params;
      await studentService.assertBelongsToDriver(studentId, req.user.id);
      const updated = await dailyStatusService.cancelBoarded(studentId, new Date());
      res.status(StatusCodeHttp.OK).json(updated);
    } catch (err) {
      next(err);
    }
  },

  /** POST /api/daily-status/reset-all (motorista reseta todos os embarques do dia ao finalizar trajeto) */
  async resetAllBoarded(req: Request, res: Response, next: NextFunction) {
    try {
      if (!hasRole(req.user!, "driver")) {
        return res.status(StatusCodeHttp.FORBIDDEN).json({ error: "Apenas motoristas podem realizar essa ação" });
      }
      const classId = (req.body?.classId || req.query?.classId) as string | undefined;
      await dailyStatusService.resetAllBoarded(req.user!.id, new Date(), classId);
      res.status(StatusCodeHttp.OK).json({ message: "Check-ins resetados com sucesso" });
    } catch (err) {
      next(err);
    }
  },

  /** RF02 — GET /api/daily-status/missing-count (consultado via polling pelo frontend) */
  async getMissingCount(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(StatusCodeHttp.UNAUTHORIZED).json({ error: "Não autorizado" });
      }
      if (hasRole(req.user, "admin")) {
        return res.status(StatusCodeHttp.FORBIDDEN).json({ error: "Apenas motoristas e alunos podem realizar essa ação" });
      }

      let driverId = "";
      let classId: string | undefined = undefined;

      if (req.user.role === "student") {
        const student = await studentService.findById(req.user.id);
        driverId = student.driverId;
        classId = student.classId;
      } else {
        driverId = req.user.id;
        classId = req.query.classId as string | undefined;
      }

      const tripState = dailyStatusService.getTripState(driverId, new Date(), classId);
      const trip = (req.query.trip as "ida" | "volta") || tripState.trip;
      const result = await dailyStatusService.getMissingStudents(driverId, new Date(), trip, classId);

      let isBoarded = false;
      let currentStatus = "vai_normal";
      if (req.user.role === "student") {
        isBoarded = await dailyStatusService.isStudentBoarded(req.user.id, new Date());
        const statusRecord = await dailyStatusRepository.findByStudentAndDate(req.user.id, toDateOnly(new Date()));
        if (statusRecord) {
          currentStatus = statusRecord.status;
        } else {
          currentStatus = await studentWeeklyScheduleService.getDefaultStatusForDate(req.user.id, new Date());
        }
      }

      res.status(StatusCodeHttp.OK).json({
        cancelled: result.cancelled,
        missingCount: result.missingStudentIds.length,
        isBoarded,
        currentStatus,
        trip: tripState.trip,
        tripStep: tripState.step,
      });
    } catch (err) {
      next(err);
    }
  },

  /** POST /api/daily-status/trip-state (somente motorista) */
  async setTripState(req: Request, res: Response, next: NextFunction) {
    try {
      if (!hasRole(req.user!, "driver")) {
        return res.status(StatusCodeHttp.FORBIDDEN).json({ error: "Apenas motoristas podem realizar essa ação" });
      }
      const { trip, step, classId } = req.body;
      const updated = dailyStatusService.setTripState(
        req.user!.id,
        new Date(),
        trip ?? "ida",
        step ?? "aguardando",
        classId
      );
      res.status(StatusCodeHttp.OK).json(updated);
    } catch (err) {
      next(err);
    }
  },
};
