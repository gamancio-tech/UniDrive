import { NextFunction, Request, Response } from "express";
import { authService } from "../services/auth.service";

export const authController = {
  async registerDriver(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password, pixKey } = req.body;
      const { driver, token } = await authService.registerDriver(name, email, password, pixKey);
      res.status(201).json({ driver: { id: driver.id, name: driver.name, email: driver.email }, token });
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
