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
        const { name, email, temporaryPassword, phone, classId } = req.body;
        const student = await studentService.create(driverId, classId, name, email, temporaryPassword, phone);
        res.status(StatusCodeHttp.CREATED).json({
          id: student.id,
          name: student.name,
          email: student.email,
          phone: student.phone,
          classId: student.classId,
        });
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
        const classIdParam = req.query.classId as string | undefined;
        if (statusParam === "true" || statusParam === "false") {
          // Sempre filtrado pela van do motorista logado.
          const students = await studentService.listByStatus(statusParam, driverId, classIdParam);
          return res.status(StatusCodeHttp.OK).json(students);
        }
        const students = await studentService.list(driverId, classIdParam);
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
      await studentService.reactivate(id, req.user!.id);
      res.status(StatusCodeHttp.OK).json({ message: "Aluno reativado com sucesso" });
    } catch (err) {
      next(err);
    }
  },

  /** DELETE /api/students/:id (somente motorista, apenas alunos da própria van) */
  async deactivate(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await studentService.deactivate(id, req.user!.id);
      res.status(StatusCodeHttp.NO_CONTENT).send();
    } catch (err) {
      next(err);
    }
  },

  /** GET /api/students/me/profile (aluno busca seus próprios dados) */
  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.id;
      const profile = await studentService.getProfile(studentId);
      res.status(StatusCodeHttp.OK).json(profile);
    } catch (err) {
      next(err);
    }
  },

  /** PATCH /api/students/me/photo (aluno atualiza ou remove sua foto de perfil) */
  async updatePhoto(req: Request, res: Response, next: NextFunction) {
    try {
      const studentId = req.user!.id;
      const { photoUrl } = req.body;
      const updated = await studentService.updatePhoto(studentId, photoUrl ?? null);
      res.status(StatusCodeHttp.OK).json({
        message: photoUrl ? "Foto de perfil atualizada com sucesso!" : "Foto de perfil removida com sucesso!",
        student: updated,
      });
    } catch (err) {
      next(err);
    }
  },

  /** PATCH /api/students/:id/phone (motorista ou o próprio aluno atualiza telefone) */
  async updatePhone(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(StatusCodeHttp.UNAUTHORIZED).json({ error: "Não autorizado" });
      }

      const id = req.params.id ?? "me";
      const { phone } = req.body;

      if (hasRole(req.user, "driver")) {
        const student = await studentService.findById(id);
        if (student.driverId !== req.user.id) {
          return res.status(StatusCodeHttp.FORBIDDEN).json({ error: "Você só pode editar alunos da sua van." });
        }
      } else if (hasRole(req.user, "student")) {
        if (req.user.id !== id && id !== "me") {
          return res.status(StatusCodeHttp.FORBIDDEN).json({ error: "Você só pode editar seu próprio perfil." });
        }
      } else {
        return res.status(StatusCodeHttp.FORBIDDEN).json({ error: "Não autorizado." });
      }

      const targetId = id === "me" ? req.user.id : id;

      if (!phone || typeof phone !== "string" || !phone.trim()) {
        return res.status(StatusCodeHttp.BAD_REQUEST).json({ error: "Informe um número de telefone válido." });
      }

      const updated = await studentService.updatePhone(targetId, phone);
      res.status(StatusCodeHttp.OK).json({
        message: "Telefone atualizado com sucesso!",
        student: updated,
      });
    } catch (err) {
      next(err);
    }
  },
};
