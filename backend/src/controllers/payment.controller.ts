import { NextFunction, Request, Response } from "express";
import { paymentService } from "../services/payment.service";
import { StatusCodeHttp } from "../utils/statusCodeHttp";
import { hasRole } from "../types/express";

export const paymentController = {
  /** GET /api/payments/me */
  async getCurrentCycle(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.id;
      const cycle = await paymentService.getOrCreateCurrentCycle(studentId);
      res.status(StatusCodeHttp.OK).json(cycle);
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/payments/me/history */
  async history(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.id;
      const cycles = await paymentService.history(studentId);
      res.status(StatusCodeHttp.OK).json(cycles);
    } catch (err) {
      next(err);
    }
  },

  /** RF08 — POST /api/payments/me/pay */
  async markPaid(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.id;
      const markedBy = req.user!.role === "driver" ? "driver" : "student";
      const cycle = await paymentService.markCurrentCyclePaid(studentId, markedBy);
      res.status(StatusCodeHttp.OK).json(cycle);
    } catch (err) {
      next(err);
    }
  },

  /** RF07 — PATCH /api/payments/me/reminder */
  async updateReminderDays(req: Request, res: Response, next: NextFunction) {
    try {
      if (!hasRole(req.user!, "student")) {
        return res.status(StatusCodeHttp.FORBIDDEN).json({ error: "Apenas alunos podem atualizar os dias de lembrete" });
      }
      const studentId = req.user!.id;
      const { days } = req.body;
      const cycle = await paymentService.updateReminderDays(studentId, Number(days));
      res.status(StatusCodeHttp.OK).json(cycle);
    } catch (err) {
      next(err);
    }
  },
};
