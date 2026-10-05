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
      if (!req.user) {
        return res.status(StatusCodeHttp.UNAUTHORIZED).json({ error: "Não autorizado" });
      }

      if (hasRole(req.user, "driver")) {
        const driverId = req.user.id;
        const statusParam = req.query.status as string | undefined;
        if (statusParam === "true" || statusParam === "false") {
          const students = await studentService.listByStatus(statusParam);
          return res.status(StatusCodeHttp.OK).json(students);
        }
        const students = await studentService.list(driverId);
        return res.status(StatusCodeHttp.OK).json(students);
      }

      if (hasRole(req.user, "admin")) {
        const students = await studentService.listActiveByDriver(req.user.id);
        return res.status(StatusCodeHttp.OK).json(students.map((s) => ({ id: s.id, name: s.name, email: s.email })));
      }

      return res.status(StatusCodeHttp.FORBIDDEN).json({ error: "Não autorizado" });
    } catch (err) {
      next(err);
    }
  },

  /** PATCH /api/students/:id/reactivate (somente motorista) */
  async reactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const student = await studentService.findById(id);
      if (hasRole(req.user!, "driver") && student.driverId !== req.user!.id) {
        return res.status(StatusCodeHttp.FORBIDDEN).json({ error: "Não autorizado" });
      }
      await studentService.reactivate(id);
      res.status(StatusCodeHttp.OK).json({ message: "Aluno reativado com sucesso" });
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
