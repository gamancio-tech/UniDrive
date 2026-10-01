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
  },

  async listAdmins() {
    return adminRepository.listAdmins();
  },

  async deleteAdmin(id: string, currentAdminId: string) {
    const admin = await adminRepository.findById(id);
    if (!admin) {
      throw new AppError("Administrador não encontrado.", StatusCodeHttp.NOT_FOUND);
    }

    if (admin.id === currentAdminId) {
      throw new AppError("Você não pode remover seu próprio perfil de administrador.", StatusCodeHttp.BAD_REQUEST);
    }

    if (admin.isSuperAdmin) {
      throw new AppError("Não é permitido remover o perfil do Super Administrador.", StatusCodeHttp.FORBIDDEN);
    }

    return adminRepository.deleteAdmin(id);
  },
};
