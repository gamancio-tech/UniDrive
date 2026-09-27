import { NextFunction, Request, Response } from "express";
import { tripCancellationService } from "../services/tripCancellation.service";
import { StatusCodeHttp } from "../utils/statusCodeHttp";
import { hasRole } from "../types/express";

export const tripCancellationController = {
  /** RF06 — POST /api/trip-cancellations (somente motorista) */
  async cancelToday(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(StatusCodeHttp.UNAUTHORIZED).json({ error: "Não autorizado" });
      } else if (hasRole(req.user, "driver")) {
        const driverId = req.user.id;
        const { reason, date } = req.body ?? {};
        const cancellation = await tripCancellationService.cancelDay(driverId, new Date(date ?? Date.now()), reason);
        res.status(StatusCodeHttp.CREATED).json(cancellation);
      } else {
        return res.status(StatusCodeHttp.FORBIDDEN).json({ error: "Não autorizado" });
      }
    } catch (err) {
      next(err);
    }
  },

  /** RF06 — DELETE /api/trip-cancellations (somente motorista) */
  async uncancelToday(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(StatusCodeHttp.UNAUTHORIZED).json({ error: "Não autorizado" });
      } else if (hasRole(req.user, "driver")) {
        const driverId = req.user.id;
        const dateParam = (req.body?.date || req.query?.date) as string | undefined;
        await tripCancellationService.uncancelDay(driverId, new Date(dateParam ?? Date.now()));
        res.status(StatusCodeHttp.OK).json({ success: true });
      } else {
        return res.status(StatusCodeHttp.FORBIDDEN).json({ error: "Não autorizado" });
      }
    } catch (err) {
      next(err);
    }
  },
};
