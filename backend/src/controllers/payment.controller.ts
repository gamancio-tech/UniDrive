import { NextFunction, Request, Response } from "express";
import { paymentService } from "../services/payment.service";

export const paymentController = {
  /** GET /api/payments/me */
  async getCurrentCycle(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.id;
      const cycle = await paymentService.getOrCreateCurrentCycle(studentId);
      res.json(cycle);
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/payments/me/history */
  async history(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.id;
      const cycles = await paymentService.history(studentId);
      res.json(cycles);
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
      res.json(cycle);
    } catch (err) {
      next(err);
    }
  },

  /** RF07 — PATCH /api/payments/me/reminder */
  async updateReminderDays(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.id;
      const { days } = req.body;
      const cycle = await paymentService.updateReminderDays(studentId, Number(days));
      res.json(cycle);
    } catch (err) {
      next(err);
    }
  },
};
