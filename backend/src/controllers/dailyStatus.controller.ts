import { NextFunction, Request, Response } from "express";
import { dailyStatusService } from "../services/dailyStatus.service";

export const dailyStatusController = {
  /** RF01 — POST /api/daily-status */
  async setStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.id;
      const { status, date } = req.body;
      const updated = await dailyStatusService.setStatus(studentId, new Date(date ?? Date.now()), status);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },

  /** RF04 — POST /api/daily-status/checkin (aluno marca o próprio embarque) */
  async checkInSelf(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.id;
      const driverId = req.user!.driverId;
      const updated = await dailyStatusService.checkIn(studentId, new Date(), driverId);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },

  /** RF04 — POST /api/daily-status/cancel-boarded (aluno cancela o próprio embarque) */
  async cancelBoardedSelf(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.id;
      const updated = await dailyStatusService.cancelBoarded(studentId, new Date());
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },
  /** RF04 — POST /api/daily-status/checkin/:studentId (motorista marca por um aluno) */
  async checkInByDriver(req: Request, res: Response, next: NextFunction) {
    try {
      const driverId = req.user!.driverId;
      const { studentId } = req.params;
      const updated = await dailyStatusService.checkIn(studentId, new Date(), driverId);
      res.json(updated);
    } catch (err) {
      next(err);
    }
  },

  /** RF02 — GET /api/daily-status/missing-count (consultado via polling pelo frontend) */
  async getMissingCount(req: Request, res: Response, next: NextFunction) {
    try {
      const driverId = req.user!.driverId;
      const result = await dailyStatusService.getMissingStudents(driverId, new Date());
      res.json({ cancelled: result.cancelled, missingCount: result.missingStudentIds.length });
    } catch (err) {
      next(err);
    }
  },
};
