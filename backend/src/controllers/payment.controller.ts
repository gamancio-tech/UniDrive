import { NextFunction, Request, Response } from "express";
import { paymentService } from "../services/payment.service";
import { StatusCodeHttp } from "../utils/statusCodeHttp";
import { hasRole } from "../utils/roles";

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
      const cycle = await paymentService.markCurrentCyclePaid(studentId, "student");
      res.status(StatusCodeHttp.OK).json(cycle);
    } catch (err) {
      next(err);
    }
  },

  /** RF08 — POST /api/payments/:studentId/pay */
  async markPaidByDriver(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentId } = req.params;
      const cycle = await paymentService.markCurrentCyclePaid(studentId, "driver");
      res.status(StatusCodeHttp.OK).json(cycle);
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/payments/student/:studentId */
  async getStudentPaymentStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentId } = req.params;
      const cycle = await paymentService.getOrCreateCurrentCycle(studentId);
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
