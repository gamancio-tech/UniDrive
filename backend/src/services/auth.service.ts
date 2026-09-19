import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { driverRepository } from "../repositories/driver.repository";
import { studentRepository } from "../repositories/student.repository";
import { env } from "../config/env";
import { AppError } from "../middlewares/errorHandler.middleware";
import { AuthenticatedUser } from "../types/express";

const SALT_ROUNDS = 10;

function signToken(user: AuthenticatedUser): string {
  return jwt.sign(user, env.jwtSecret, { expiresIn: "30d" });
}

export const authService = {
  async registerDriver(name: string, email: string, password: string, pixKey?: string) {
    const existing = await driverRepository.findByEmail(email);
    if (existing) {
      throw new AppError("Já existe um motorista cadastrado com este e-mail.", 409);
    }

    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const driver = await driverRepository.create({ name, email, passwordHash, pixKey });

    const token = signToken({ id: driver.id, role: "driver", driverId: driver.id });
    return { driver, token };
  },

  async loginDriver(email: string, password: string) {
    const driver = await driverRepository.findByEmail(email);
    if (!driver || !(await bcrypt.compare(password, driver.passwordHash))) {
      throw new AppError("E-mail ou senha inválidos.", 401);
    }

    const token = signToken({ id: driver.id, role: "driver", driverId: driver.id });
    return { driver, token };
  },

  async loginStudent(email: string, password: string) {
    const student = await studentRepository.findByEmail(email);
    if (!student || !(await bcrypt.compare(password, student.passwordHash))) {
      throw new AppError("E-mail ou senha inválidos.", 401);
    }

    const token = signToken({ id: student.id, role: "student", driverId: student.driverId });
    return { student, token };
  },
};
