import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { driverRepository } from "../repositories/driver.repository";
import { studentRepository } from "../repositories/student.repository";
import { env } from "../config/env";
import { AppError } from "../middlewares/errorHandler.middleware";
import { AuthenticatedUser } from "../types/express";
import { StatusCodeHttp } from "../utils/statusCodeHttp";
import { adminRepository } from "../repositories/admin.repository";
import { prisma } from "../lib/prisma";
import { emailService } from "../utils/emailService";

const SALT_ROUNDS = 10;

// Hash falso usado para gastar o mesmo tempo de CPU quando o e-mail não existe,
// impedindo descobrir contas cadastradas pelo tempo de resposta (V11).
const DUMMY_HASH = bcrypt.hashSync("senha-inexistente-unidrive", SALT_ROUNDS);

const INVALID_CREDENTIALS = "E-mail ou senha inválidos.";

export function signToken(user: AuthenticatedUser): string {
  return jwt.sign(user, env.jwtSecret, { algorithm: "HS256", expiresIn: "7d" });
}

/** Compara a senha em tempo constante em relação à existência da conta e exige conta ativa. */
async function verifyCredentials(password: string, passwordHash: string | undefined, active: boolean) {
  const passwordOk = await bcrypt.compare(password, passwordHash ?? DUMMY_HASH);
  if (!passwordHash || !passwordOk || !active) {
    throw new AppError(INVALID_CREDENTIALS, StatusCodeHttp.UNAUTHORIZED);
  }
}

export const authService = {
  async loginAdmin(email: string, password: string) {
    const admin = await adminRepository.findByEmail(email);
    await verifyCredentials(password, admin?.passwordHash, true);

    const token = signToken({ id: admin!.id, role: "admin", isSuperAdmin: admin!.isSuperAdmin });
    return { admin: admin!, token };
  },

  async loginDriver(email: string, password: string) {
    const driver = await driverRepository.findByEmail(email);
    await verifyCredentials(password, driver?.passwordHash, Boolean(driver?.active));

    const token = signToken({ id: driver!.id, role: "driver" });
    return { driver: driver!, token };
  },

  async loginStudent(email: string, password: string) {
    const student = await studentRepository.findByEmail(email);
    await verifyCredentials(password, student?.passwordHash, Boolean(student?.active));

    const token = signToken({ id: student!.id, role: "student", driverId: student!.driverId });
    return { student: student!, token };
  },

  async forgotPassword(email: string) {
    const [admin, driver, student] = await Promise.all([
      adminRepository.findByEmail(email),
      driverRepository.findByEmail(email),
      studentRepository.findByEmail(email),
    ]);

    const userExists = admin || driver || student;
    if (!userExists) {
      return; 
    }

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); 

    await prisma.passwordReset.upsert({
      where: { email },
      update: { token, expiresAt },
      create: { email, token, expiresAt },
    });

    await emailService.sendMagicLink(email, token);
  },

  async resetPassword(token: string, newPassword: string) {
    const resetRecord = await prisma.passwordReset.findUnique({ where: { token } });
    if (!resetRecord || resetRecord.expiresAt < new Date()) {
      throw new AppError("Token inválido ou expirado.", StatusCodeHttp.BAD_REQUEST);
    }

    const { email } = resetRecord;
    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);

    const [admin, driver, student] = await Promise.all([
      adminRepository.findByEmail(email),
      driverRepository.findByEmail(email),
      studentRepository.findByEmail(email),
    ]);

    if (admin) await prisma.admin.update({ where: { email }, data: { passwordHash } });
    else if (driver) await prisma.driver.update({ where: { email }, data: { passwordHash } });
    else if (student) await prisma.student.update({ where: { email }, data: { passwordHash } });

    await prisma.passwordReset.delete({ where: { id: resetRecord.id } });
  },
};
