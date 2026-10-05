import { NextFunction, Request, Response } from "express";
import { paymentService } from "../services/payment.service";
import { StatusCodeHttp } from "../utils/statusCodeHttp";
import { hasRole } from "../utils/roles";
import { studentService } from "../services/student.service";

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

  /** RF08 — POST /api/payments/me/pay (Aluno informa que realizou o pagamento) */
  async requestPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.id;
      const cycle = await paymentService.requestCurrentCyclePayment(studentId);
      res.status(StatusCodeHttp.OK).json(cycle);
    } catch (err) {
      next(err);
    }
  },

  /** RF08 — POST /api/payments/:studentId/pay (Motorista confirma o pagamento do aluno) */
  async confirmPaidByDriver(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentId } = req.params;
      const driverId = req.user!.id;
      const cycle = await paymentService.confirmPaymentByDriver(studentId, driverId);
      res.status(StatusCodeHttp.OK).json(cycle);
    } catch (err) {
      next(err);
    }
  },

  /** POST /api/payments/:studentId/reject (Motorista recusa confirmação se o pagamento não foi recebido) */
  async rejectPaymentByDriver(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentId } = req.params;
      const driverId = req.user!.id;
      const cycle = await paymentService.rejectPaymentByDriver(studentId, driverId);
      res.status(StatusCodeHttp.OK).json(cycle);
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/payments/student/:studentId */
  async getStudentPaymentStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { studentId } = req.params;
      await studentService.assertBelongsToDriver(studentId, req.user!.id);
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
      const days = Number(req.body.days);
      if (!Number.isInteger(days) || days < 0 || days > 28) {
        return res.status(StatusCodeHttp.BAD_REQUEST).json({ error: "Dias de lembrete deve ser um inteiro entre 0 e 28." });
      }
      const cycle = await paymentService.updateReminderDays(studentId, days);
      res.status(StatusCodeHttp.OK).json(cycle);
    } catch (err) {
      next(err);
    }
  },
};
