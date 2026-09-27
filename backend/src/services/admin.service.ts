import { AppError } from "../middlewares/errorHandler.middleware";
import { adminRepository } from "../repositories/admin.repository";
import { StatusCodeHttp } from "../utils/statusCodeHttp";
import bcrypt from "bcrypt"

const SALT_ROUNDS = 12;

export const adminService = {
  async createAdmin(
    name: string,
    email: string,
    password: string
  ) {
    const existingAdmin = await adminRepository.findByEmail(email);
    if (existingAdmin) {
      throw new AppError("Já existe um administrador cadastrado com este e-mail.", StatusCodeHttp.CONFLICT);
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const admin = await adminRepository.createAdmin(name, email, passwordHash);

    return admin;
  }
};
