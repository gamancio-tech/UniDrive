import { NextFunction, Request, Response } from "express";
import { tripCancellationService } from "../services/tripCancellation.service";

export const tripCancellationController = {
  /** RF06 — POST /api/trip-cancellations (somente motorista) */
  async cancelToday(req: Request, res: Response, next: NextFunction) {
    try {
      const driverId = req.user!.driverId;
      const { reason, date } = req.body;
      const cancellation = await tripCancellationService.cancelDay(driverId, new Date(date ?? Date.now()), reason);
      res.status(201).json(cancellation);
    } catch (err) {
      next(err);
    }
  },
};
