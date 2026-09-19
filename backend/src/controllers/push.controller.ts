import { NextFunction, Request, Response } from "express";
import { pushService } from "../services/push.service";

export const pushController = {
  /** GET /api/push/public-key — usado pelo frontend para se inscrever no Web Push */
  getPublicKey(_req: Request, res: Response) {
    res.json({ publicKey: pushService.publicKey });
  },

  /** POST /api/push/subscribe */
  async subscribe(req: Request, res: Response, next: NextFunction) {
    try {
      const { endpoint, keys } = req.body;
      const isDriver = req.user!.role === "driver";
      await pushService.saveSubscription({
        endpoint,
        keys,
        studentId: isDriver ? undefined : req.user!.id,
        driverId: isDriver ? req.user!.id : undefined,
      });
      res.status(201).json({ ok: true });
    } catch (err) {
      next(err);
    }
  },
};
