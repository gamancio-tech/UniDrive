import { NextFunction, Request, Response } from "express";
import { tripCancellationService } from "../services/tripCancellation.service";
import { StatusCodeHttp } from "../utils/statusCodeHttp";
import { hasRole } from "../utils/roles";

export const tripCancellationController = {
  /** RF06 — POST /api/trip-cancellations (somente motorista) */
  async cancelToday(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(StatusCodeHttp.UNAUTHORIZED).json({ error: "Não autorizado" });
      } else if (hasRole(req.user, "driver")) {
        const driverId = req.user.id;
        const { reason, date, classIds } = req.body ?? {};
        const cancellations = await tripCancellationService.cancelDay(
          driverId,
          classIds,
          new Date(date ?? Date.now()),
          reason
        );
        res.status(StatusCodeHttp.CREATED).json(cancellations);
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
        let classIds: string[] = [];
        if (Array.isArray(req.body?.classIds) && req.body.classIds.length > 0) {
          classIds = req.body.classIds;
        } else if (req.query?.classId) {
          classIds = [req.query.classId as string];
        }

        await tripCancellationService.uncancelDay(
          driverId,
          classIds,
          new Date(dateParam ?? Date.now())
        );
        res.status(StatusCodeHttp.OK).json({ success: true });
      } else {
        return res.status(StatusCodeHttp.FORBIDDEN).json({ error: "Não autorizado" });
      }
    } catch (err) {
      next(err);
    }
  },
};
