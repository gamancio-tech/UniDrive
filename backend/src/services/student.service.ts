import bcrypt from "bcrypt";
import { studentRepository } from "../repositories/student.repository";
import { dailyStatusRepository } from "../repositories/dailyStatus.repository";
import { AppError } from "../middlewares/errorHandler.middleware";
import { StatusCodeHttp } from "../utils/statusCodeHttp";

const SALT_ROUNDS = 10;

function toDateOnly(date: Date): Date {
  return new Date(date.toISOString().slice(0, 10));
}

export const studentService = {
  /**
   * RF09: motorista cadastra um aluno diretamente com uma senha provisória.
   * Simplificação para o MVP — um fluxo de convite por link/código pode substituir isso depois.
   */
  async create(driverId: string, name: string, email: string, temporaryPassword: string) {
    const existing = await studentRepository.findByEmail(email);
    if (existing) {
      if (existing.active) {
        throw new AppError("Já existe um aluno cadastrado com este e-mail.", StatusCodeHttp.CONFLICT);
      } else {
        throw new AppError("Estudante já cadastrado, porém inativo. Use a opção de reativar.", StatusCodeHttp.CONFLICT);
      }
    }

    const passwordHash = await bcrypt.hash(temporaryPassword, SALT_ROUNDS);
    return studentRepository.create({ driverId, name, email, passwordHash });
  },

  async deactivate(id: string) {
    const student = await studentRepository.findById(id);
    if (!student) {
      throw new AppError("Aluno não encontrado.", StatusCodeHttp.NOT_FOUND);
    }
    if (!student.active) {
      throw new AppError("Aluno já desativado.", StatusCodeHttp.BAD_REQUEST);
    }
    return studentRepository.deactivate(id);
  },

  async reactivate(id: string) {
    const student = await studentRepository.findById(id);
    if (!student) {
      throw new AppError("Aluno não encontrado.", StatusCodeHttp.NOT_FOUND);
    }
    if (student.active) {
      throw new AppError("Aluno já ativo.", StatusCodeHttp.BAD_REQUEST);
    }
    return studentRepository.reactivate(id);
  },

  async list(driverId: string) {
    const today = toDateOnly(new Date());
    const students = await dailyStatusRepository.listStudentsWithStatusForDate(driverId, today);
    return students.map((student) => ({
      id: student.id,
      name: student.name,
      email: student.email,
      todayStatus: student.dailyStatuses[0]?.status ?? "vai_normal",
      isBoarded: Boolean(student.dailyStatuses[0]?.boardedAt),
    }));
  },

  async listActiveByDriver(driverId: string) {
    return studentRepository.listActiveByDriver(driverId);
  },

  async listByStatus(status: string) {
    if (status === "true") {
      return await studentRepository.listActiveAll();
    } else if (status === "false") {
      return await studentRepository.listDisableAll();
    } else {
      throw new AppError("Status inválido.", StatusCodeHttp.BAD_REQUEST);
    }
  },

  async findById(id: string) {
    const student = await studentRepository.findById(id);
    if (!student) {
      throw new AppError("Aluno não encontrado.", StatusCodeHttp.NOT_FOUND);
    }
    return student;
  },
};
