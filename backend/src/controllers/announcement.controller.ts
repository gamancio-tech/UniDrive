import { NextFunction, Request, Response } from "express";
import { announcementService } from "../services/announcement.service";
import { StatusCodeHttp } from "../utils/statusCodeHttp";
import { hasRole } from "../utils/roles";

export const announcementController = {
  /** RF05 — POST /api/announcements (somente motorista) */
  async publish(req: Request, res: Response, next: NextFunction) {
    try {
      if (!hasRole(req.user!, "driver")) {
        return res.status(StatusCodeHttp.FORBIDDEN).json({ error: "Apenas motoristas podem publicar anúncios" });
      }
      const driverId = req.user.id;
      const { message, classIds } = req.body;
      const announcements = await announcementService.publish(driverId, message, classIds);
      res.status(StatusCodeHttp.CREATED).json(announcements);
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/announcements */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(StatusCodeHttp.UNAUTHORIZED).json({ error: "Não autorizado" });
      }
      if (hasRole(req.user, "admin")) {
        return res.status(StatusCodeHttp.FORBIDDEN).json({ error: "Acesso não permitido para este perfil." });
      }
      const classIdQuery = req.query.classId as string | undefined;
      const announcements = await announcementService.list(req.user, classIdQuery);
      res.json(announcements);
    } catch (err) {
      next(err);
    }
  },
};
