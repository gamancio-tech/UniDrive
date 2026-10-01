import { NextFunction, Request, Response } from "express";
import { authService } from "../services/auth.service";

import { StatusCodeHttp } from "../utils/statusCodeHttp";

export const authController = {
  async loginAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const { admin, token } = await authService.loginAdmin(email, password);
      res.status(StatusCodeHttp.OK).json({
        admin: {
          id: admin.id,
          name: admin.name,
          email: admin.email,
          isSuperAdmin: admin.isSuperAdmin,
        },
        token,
      });
    } catch (err) {
      next(err);
    }
  },

  async loginDriver(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const { driver, token } = await authService.loginDriver(email, password);
      res.json({ driver: { id: driver.id, name: driver.name, email: driver.email }, token });
    } catch (err) {
      next(err);
    }
  },

  async loginStudent(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const { student, token } = await authService.loginStudent(email, password);
      res.json({ student: { id: student.id, name: student.name, email: student.email }, token });
    } catch (err) {
      next(err);
    }
  },
};
