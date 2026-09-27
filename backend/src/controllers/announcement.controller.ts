import { NextFunction, Request, Response } from "express";
import { announcementService } from "../services/announcement.service";
import { StatusCodeHttp } from "../utils/statusCodeHttp";
import { hasRole } from "../types/express";

export const announcementController = {
  /** RF05 — POST /api/announcements (somente motorista) */
  async publish(req: Request, res: Response, next: NextFunction) {
    try {
      if (!hasRole(req.user!, "driver")) {
        return res.status(StatusCodeHttp.FORBIDDEN).json({ error: "Apenas motoristas podem publicar anúncios" });
      } // Precisa de estar autenticado e com role driver, a partir daqui o código ja assume isso 
      const driverId = req.user.id;
      const { message } = req.body;
      const announcement = await announcementService.publish(driverId, message);
      res.status(StatusCodeHttp.CREATED).json(announcement);
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/announcements */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      if (!hasRole(req.user!, "driver")) {
        return res.status(StatusCodeHttp.FORBIDDEN).json({ error: "Apenas motoristas podem publicar anúncios" });
      }
      const driverId = req.user.id;
      const announcements = await announcementService.list(driverId);
      res.json(announcements);
    } catch (err) {
      next(err);
    }
  },
};

