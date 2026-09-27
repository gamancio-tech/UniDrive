import { NextFunction, Request, Response } from "express";
import { studentService } from "../services/student.service";
import { StatusCodeHttp } from "../utils/statusCodeHttp";
import { hasRole } from "../utils/roles";

export const studentController = {
  /** RF09 — POST /api/students (somente motorista) */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(StatusCodeHttp.UNAUTHORIZED).json({ error: "Não autorizado" });
      } else if (hasRole(req.user, "driver")) {
        const driverId = req.user.id;
        const { name, email, temporaryPassword } = req.body;
        const student = await studentService.create(driverId, name, email, temporaryPassword);
        res.status(StatusCodeHttp.CREATED).json({ id: student.id, name: student.name, email: student.email });
      } else {
        return res.status(StatusCodeHttp.FORBIDDEN).json({ error: "Não autorizado" });
      }
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/students (somente motorista e admin) */
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      let students;
      if (!req.user) {
        return res.status(StatusCodeHttp.UNAUTHORIZED).json({ error: "Não autorizado" });
      } else if (hasRole(req.user, "driver")) {
        const driverId = req.user.id;
        students = await studentService.list(driverId);
      } else if (hasRole(req.user, "admin")) {
        students = await studentService.listActiveAll();
      } else {
        return res.status(StatusCodeHttp.FORBIDDEN).json({ error: "Não autorizado" });
      }
      res.status(StatusCodeHttp.OK).json(students.map((s) => ({ id: s.id, name: s.name, email: s.email })));
    } catch (err) {
      next(err);
    }
  },

  /** DELETE /api/students/:id (somente motorista) */
  async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await studentService.deactivate(id);
      res.status(StatusCodeHttp.NO_CONTENT).send();
    } catch (err) {
      next(err);
    }
  },
};
