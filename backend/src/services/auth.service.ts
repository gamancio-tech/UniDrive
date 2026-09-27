import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { driverRepository } from "../repositories/driver.repository";
import { studentRepository } from "../repositories/student.repository";
import { env } from "../config/env";
import { AppError } from "../middlewares/errorHandler.middleware";
import { AuthenticatedUser } from "../types/express";
import { StatusCodeHttp } from "../utils/statusCodeHttp";
import { adminRepository } from "../repositories/admin.repository";

const SALT_ROUNDS = 10;

export function signToken(user: AuthenticatedUser): string {
  return jwt.sign(user, env.jwtSecret, { expiresIn: "30d" });
}

export const authService = {
  async loginAdmin(email: string, password: string) {
    const admin = await adminRepository.findByEmail(email);
    if (!admin || !(await bcrypt.compare(password, admin.passwordHash))) {
      throw new AppError("E-mail ou senha inválidos.", StatusCodeHttp.UNAUTHORIZED);
    }

    const token = signToken({ id: admin.id, role: "admin" });
    return { admin, token };
  },

  async loginDriver(email: string, password: string) {
    const driver = await driverRepository.findByEmail(email);
    if (!driver || !(await bcrypt.compare(password, driver.passwordHash))) {
      throw new AppError("E-mail ou senha inválidos.", StatusCodeHttp.UNAUTHORIZED);
    }

    const token = signToken({ id: driver.id, role: "driver" });
    return { driver, token };
  },

  async loginStudent(email: string, password: string) {
    const student = await studentRepository.findByEmail(email);
    if (!student || !(await bcrypt.compare(password, student.passwordHash))) {
      throw new AppError("E-mail ou senha inválidos.", StatusCodeHttp.UNAUTHORIZED);
    }

    const token = signToken({ id: student.id, role: "student", driverId: student.driverId });
    return { student, token };
  },
};
