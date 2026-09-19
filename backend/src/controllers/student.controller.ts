import { NextFunction, Request, Response } from "express";
import { studentService } from "../services/student.service";

export const studentController = {
  /** RF09 — POST /api/students (somente motorista) */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const driverId = req.user!.driverId;
      const { name, email, temporaryPassword } = req.body;
      const student = await studentService.create(driverId, name, email, temporaryPassword);
      res.status(201).json({ id: student.id, name: student.name, email: student.email });
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/students (somente motorista) */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const driverId = req.user!.driverId;
      const students = await studentService.list(driverId);
      res.json(students.map((s) => ({ id: s.id, name: s.name, email: s.email })));
    } catch (err) {
      next(err);
    }
  },

  /** DELETE /api/students/:id (somente motorista) */
  async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await studentService.deactivate(id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
};
