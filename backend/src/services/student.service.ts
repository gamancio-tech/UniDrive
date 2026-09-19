import bcrypt from "bcrypt";
import { studentRepository } from "../repositories/student.repository";
import { AppError } from "../middlewares/errorHandler.middleware";

const SALT_ROUNDS = 10;

export const studentService = {
  /**
   * RF09: motorista cadastra um aluno diretamente com uma senha provisória.
   * Simplificação para o MVP — um fluxo de convite por link/código pode substituir isso depois.
   */
  async create(driverId: string, name: string, email: string, temporaryPassword: string) {
    const existing = await studentRepository.findByEmail(email);
    if (existing) {
      throw new AppError("Já existe um aluno cadastrado com este e-mail.", 409);
    }

    const passwordHash = await bcrypt.hash(temporaryPassword, SALT_ROUNDS);
    return studentRepository.create({ driverId, name, email, passwordHash });
  },

  list(driverId: string) {
    return studentRepository.listActiveByDriver(driverId);
  },

  /** RF09: remove o aluno sem apagar seu histórico (soft delete). */
  deactivate(id: string) {
    return studentRepository.deactivate(id);
  },
};
