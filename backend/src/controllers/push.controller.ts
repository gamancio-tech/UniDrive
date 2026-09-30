import { NextFunction, Request, Response } from "express";
import { pushService } from "../services/push.service";
import { StatusCodeHttp } from "../utils/statusCodeHttp";

export const pushController = {
  /** GET /api/push/public-key — usado pelo frontend para se inscrever no Web Push */
  getPublicKey(_req: Request, res: Response) {
    res.status(StatusCodeHttp.OK).json({ publicKey: pushService.publicKey });
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
      res.status(StatusCodeHttp.CREATED).json({ ok: true });
    } catch (err) {
      next(err);
    }
  },

  /** POST /api/push/test — envia uma notificação de teste para o próprio usuário autenticado */
  async sendTestNotification(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(StatusCodeHttp.UNAUTHORIZED).json({ error: "Não autorizado." });
      }
      const result = await pushService.sendTestNotification(req.user.id, req.user.role);
      res.status(StatusCodeHttp.OK).json({ ok: true, ...result });
    } catch (err) {
      next(err);
    }
  },
};
