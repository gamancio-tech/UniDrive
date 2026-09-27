import { NextFunction, Request, Response } from "express";
import { StatusCodeHttp } from "../utils/statusCodeHttp";
import { studentService } from "../services/student.service";
import { adminService } from "../services/admin.service";
import { hasRole } from "../types/express";
import { driverService } from "../services/driver.service";

export const adminController = {

  async createAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(StatusCodeHttp.UNAUTHORIZED).json({ error: "Não autorizado" });
      } else if (!hasRole(req.user, "admin")) {
        return res.status(StatusCodeHttp.FORBIDDEN).json({ error: "Não autorizado" });
      }

      const { name, email, password } = req.body;
      const admin = await adminService.createAdmin(name, email, password);

      res.status(StatusCodeHttp.CREATED).json({ id: admin.id, name: admin.name, email: admin.email });
    } catch (err) {
      next(err);
    }
  },

  async createDriver(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(StatusCodeHttp.UNAUTHORIZED).json({ error: "Não autorizado" });
      } else if (!hasRole(req.user, "admin")) {
        return res.status(StatusCodeHttp.FORBIDDEN).json({ error: "Não autorizado" });
      }

      const { name, email, password, pixKey } = req.body;
      const driver = await driverService.create(name, email, password, pixKey);

      res.status(StatusCodeHttp.CREATED).json({ id: driver.id, name: driver.name, email: driver.email });
    } catch (err) {
      next(err);
    }
  },

  async createStudent(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(StatusCodeHttp.UNAUTHORIZED).json({ error: "Não autorizado" });
      } else if (!hasRole(req.user, "admin")) {
        return res.status(StatusCodeHttp.FORBIDDEN).json({ error: "Não autorizado" });
      }

      const { name, email, password, driverId } = req.body;
      const student = await studentService.create(driverId, name, email, password);

      res.status(StatusCodeHttp.CREATED).json({ id: student.id, name: student.name, email: student.email, driverId: student.driverId });
    } catch (err) {
      next(err);
    }
  },

  async getDrivers(req: Request, res: Response, next: NextFunction) {
    try {
      const drivers = await driverService.getAllDrivers();
      res.status(StatusCodeHttp.OK).json(drivers);
    } catch (err) {
      next(err);
    }
  },

  async getStudentByStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const { status } = req.params;
      const students = await studentService.listByStatus(status);
      res.status(StatusCodeHttp.OK).json(students);
    } catch (err) {
      next(err);
    }
  },

  async getStudentById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const student = await studentService.findById(id);
      res.status(StatusCodeHttp.OK).json(student);
    } catch (err) {
      next(err);
    }
  },

  async getDriverById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const driver = await driverService.findById(id);
      res.status(StatusCodeHttp.OK).json(driver);
    } catch (err) {
      next(err);
    }
  },

  // async pushSubscriptions(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     const { endpoint, keys } = req.body;
  //     await pushService.saveSubscription({
  //       endpoint,
  //       keys,
  //       adminId: req.user!.id,
  //     });
  //     res.status(StatusCodeHttp.CREATED).json({ ok: true });
  //   } catch (err) {
  //     next(err);
  //   }
  // }
}