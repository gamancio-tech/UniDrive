import { NextFunction, Request, Response } from "express";
import { dailyStatusService } from "../services/dailyStatus.service";
import { StatusCodeHttp } from "../utils/statusCodeHttp";
import { hasRole } from "../utils/roles";

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
      const updated = await dailyStatusService.checkIn(studentId, new Date(), driverId);
      res.status(StatusCodeHttp.OK).json(updated);
    } catch (err) {
      next(err);
    }
  },

  /** RF02 — GET /api/daily-status/missing-count (consultado via polling pelo frontend) */
  async getMissingCount(req: Request, res: Response, next: NextFunction) {
    try {
      if(!req.user) {
        return res.status(StatusCodeHttp.UNAUTHORIZED).json({ error: "Não autorizado" });
      }
      if (hasRole(req.user, "admin")) {
        return res.status(StatusCodeHttp.FORBIDDEN).json({ error: "Apenas motoristas podem realizar essa ação" });
      }
      const driverId = req.user.id;
      const result = await dailyStatusService.getMissingStudents(driverId, new Date());

      let isBoarded = false;
      if (req.user.role === "student") {
        isBoarded = await dailyStatusService.isStudentBoarded(req.user.id, new Date());
      }

      res.status(StatusCodeHttp.OK).json({
        cancelled: result.cancelled,
        missingCount: result.missingStudentIds.length,
        isBoarded,
      });
    } catch (err) {
      next(err);
    }
  },
};
