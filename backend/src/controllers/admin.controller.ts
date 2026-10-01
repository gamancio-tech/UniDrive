import { NextFunction, Request, Response } from "express";
import { StatusCodeHttp } from "../utils/statusCodeHttp";
import { studentService } from "../services/student.service";
import { adminService } from "../services/admin.service";
import { hasRole } from "../utils/roles";
import { driverService } from "../services/driver.service";

export const adminController = {

  async createAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(StatusCodeHttp.UNAUTHORIZED).json({ error: "Não autorizado" });
      } else if (!hasRole(req.user, "admin") || !req.user.isSuperAdmin) {
        return res.status(StatusCodeHttp.FORBIDDEN).json({ error: "Apenas o Super Administrador pode cadastrar novos administradores." });
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

  async deactivateDriver(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(StatusCodeHttp.UNAUTHORIZED).json({ error: "Não autorizado" });
      } else if (!hasRole(req.user, "admin")) {
        return res.status(StatusCodeHttp.FORBIDDEN).json({ error: "Não autorizado" });
      }

      const { id } = req.params;
      const driver = await driverService.deactivate(id);
      res.status(StatusCodeHttp.OK).json(driver);
    } catch (err) {
      next(err);
    }
  },

  async reactivateDriver(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(StatusCodeHttp.UNAUTHORIZED).json({ error: "Não autorizado" });
      } else if (!hasRole(req.user, "admin")) {
        return res.status(StatusCodeHttp.FORBIDDEN).json({ error: "Não autorizado" });
      }

      const { id } = req.params;
      const driver = await driverService.reactivate(id);
      res.status(StatusCodeHttp.OK).json(driver);
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

  async deactivateStudent(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(StatusCodeHttp.UNAUTHORIZED).json({ error: "Não autorizado" });
      } else if (!hasRole(req.user, "admin")) {
        return res.status(StatusCodeHttp.FORBIDDEN).json({ error: "Não autorizado" });
      }

      const { id } = req.params;
      const student = await studentService.deactivate(id);
      res.status(StatusCodeHttp.OK).json(student);
    } catch (err) {
      next(err);
    }
  },

  async reactivateStudent(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(StatusCodeHttp.UNAUTHORIZED).json({ error: "Não autorizado" });
      } else if (!hasRole(req.user, "admin")) {
        return res.status(StatusCodeHttp.FORBIDDEN).json({ error: "Não autorizado" });
      }

      const { id } = req.params;
      const student = await studentService.reactivate(id);
      res.status(StatusCodeHttp.OK).json(student);
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
      const status = (req.query.status as string) || "true";
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

  async getAdmins(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(StatusCodeHttp.UNAUTHORIZED).json({ error: "Não autorizado" });
      } else if (!hasRole(req.user, "admin") || !req.user.isSuperAdmin) {
        return res.status(StatusCodeHttp.FORBIDDEN).json({ error: "Apenas o Super Administrador pode visualizar os perfis de administradores." });
      }

      const admins = await adminService.listAdmins();
      res.status(StatusCodeHttp.OK).json(admins);
    } catch (err) {
      next(err);
    }
  },

  async deleteAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) {
        return res.status(StatusCodeHttp.UNAUTHORIZED).json({ error: "Não autorizado" });
      } else if (!hasRole(req.user, "admin") || !req.user.isSuperAdmin) {
        return res.status(StatusCodeHttp.FORBIDDEN).json({ error: "Apenas o Super Administrador pode remover administradores." });
      }

      const { id } = req.params;
      const currentAdminId = req.user.id;
      const deleted = await adminService.deleteAdmin(id, currentAdminId);
      res.status(StatusCodeHttp.OK).json({ message: "Administrador removido com sucesso.", admin: deleted });
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