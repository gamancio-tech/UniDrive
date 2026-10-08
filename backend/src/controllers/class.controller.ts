import { Request, Response, NextFunction } from "express";
import { classService } from "../services/class.service";
import { StatusCodeHttp } from "../utils/statusCodeHttp";

export const classController = {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const driverId = req.user!.id;
      const classes = await classService.listByDriver(driverId);
      res.status(StatusCodeHttp.OK).json(classes);
    } catch (err) {
      next(err);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const driverId = req.user!.id;
      const { name } = req.body;
      const created = await classService.create(driverId, name);
      res.status(StatusCodeHttp.CREATED).json(created);
    } catch (err) {
      next(err);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const driverId = req.user!.id;
      const { id } = req.params;
      const { name } = req.body;
      const updated = await classService.update(driverId, id, name);
      res.status(StatusCodeHttp.OK).json(updated);
    } catch (err) {
      next(err);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const driverId = req.user!.id;
      const { id } = req.params;
      await classService.delete(driverId, id);
      res.status(StatusCodeHttp.NO_CONTENT).send();
    } catch (err) {
      next(err);
    }
  },
};
