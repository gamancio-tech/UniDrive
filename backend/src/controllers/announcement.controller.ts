import { NextFunction, Request, Response } from "express";
import { announcementService } from "../services/announcement.service";

export const announcementController = {
  /** RF05 — POST /api/announcements (somente motorista) */
  async publish(req: Request, res: Response, next: NextFunction) {
    try {
      const driverId = req.user!.driverId;
      const { message } = req.body;
      const announcement = await announcementService.publish(driverId, message);
      res.status(201).json(announcement);
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/announcements */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const driverId = req.user!.driverId;
      const announcements = await announcementService.list(driverId);
      res.json(announcements);
    } catch (err) {
      next(err);
    }
  },
};
