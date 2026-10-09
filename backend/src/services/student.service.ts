import bcrypt from "bcrypt";
import { studentRepository } from "../repositories/student.repository";
import { classRepository } from "../repositories/class.repository";
import { dailyStatusRepository } from "../repositories/dailyStatus.repository";
import { AppError } from "../middlewares/errorHandler.middleware";
import { StatusCodeHttp } from "../utils/statusCodeHttp";
import { invalidateAccountCache } from "../lib/accountStatus";

const SALT_ROUNDS = 10;

function toDateOnly(date: Date): Date {
  return new Date(date.toISOString().slice(0, 10));
}

/** Aceita apenas JPEG/PNG/WEBP em base64 (SVG é recusado de propósito: pode carregar script). */
const PHOTO_REGEX = /^data:image\/(jpeg|png|webp);base64,([A-Za-z0-9+/]+={0,2})$/;
const MAX_PHOTO_CHARS = 150_000;

/** Confere os "magic bytes" para garantir que o conteúdo é mesmo a imagem declarada. */
function hasValidImageSignature(mime: string, base64: string): boolean {
  const head = Buffer.from(base64.slice(0, 32), "base64");
  if (mime === "jpeg") return head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff;
  if (mime === "png") return head.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  return head.subarray(0, 4).toString("ascii") === "RIFF" && head.subarray(8, 12).toString("ascii") === "WEBP";
}

export const studentService = {
  /**
   * RF09: motorista cadastra um aluno diretamente com uma senha provisória vinculado a uma turma.
   */
  async create(
    driverId: string,
    classId: string,
    name: string,
    email: string,
    temporaryPassword: string,
    phone?: string | null
  ) {
    const targetClass = await classRepository.findByIdAndDriver(classId, driverId);
    if (!targetClass) {
      throw new AppError("Turma não encontrada.", StatusCodeHttp.NOT_FOUND);
    }

    const existing = await studentRepository.findByEmail(email);
    if (existing) {
      if (existing.active) {
        throw new AppError("Já existe um aluno cadastrado com este e-mail.", StatusCodeHttp.CONFLICT);
      } else {
        throw new AppError("Estudante já cadastrado, porém inativo. Use a opção de reativar.", StatusCodeHttp.CONFLICT);
      }
    }

    const passwordHash = await bcrypt.hash(temporaryPassword, SALT_ROUNDS);
    return studentRepository.create({
      driverId,
      classId,
      name,
      email,
      passwordHash,
      phone: phone?.trim() || null,
    });
  },

  /**
   * Garante que o aluno pertence à van do motorista. Retorna 404 (e não 403)
   * para não revelar que o ID existe em outra van.
   */
  async assertBelongsToDriver(studentId: string, driverId: string) {
    const student = await studentRepository.findById(studentId);
    if (!student || student.driverId !== driverId) {
      throw new AppError("Aluno não encontrado.", StatusCodeHttp.NOT_FOUND);
    }
    return student;
  },

  /** Se driverId for informado (chamada de motorista), exige que o aluno seja da van dele. */
  async deactivate(id: string, driverId?: string) {
    const student = driverId ? await this.assertBelongsToDriver(id, driverId) : await studentRepository.findById(id);
    if (!student) {
      throw new AppError("Aluno não encontrado.", StatusCodeHttp.NOT_FOUND);
    }
    if (!student.active) {
      throw new AppError("Aluno já desativado.", StatusCodeHttp.BAD_REQUEST);
    }
    const updated = await studentRepository.deactivate(id);
    invalidateAccountCache(id);
    return updated;
  },

  async reactivate(id: string, driverId?: string) {
    const student = driverId ? await this.assertBelongsToDriver(id, driverId) : await studentRepository.findById(id);
    if (!student) {
      throw new AppError("Aluno não encontrado.", StatusCodeHttp.NOT_FOUND);
    }
    if (student.active) {
      throw new AppError("Aluno já ativo.", StatusCodeHttp.BAD_REQUEST);
    }
    const updated = await studentRepository.reactivate(id);
    invalidateAccountCache(id);
    return updated;
  },

  async list(driverId: string, classId?: string) {
    if (classId) {
      const targetClass = await classRepository.findByIdAndDriver(classId, driverId);
      if (!targetClass) {
        throw new AppError("Turma não encontrada.", StatusCodeHttp.NOT_FOUND);
      }
    }

    const today = toDateOnly(new Date());
    const dayOfWeek = today.getDay();
    const students = await dailyStatusRepository.listStudentsWithStatusForDate(driverId, today, classId);
    return students.map((student) => {
      const weeklyDefault = student.weeklySchedules.find((w) => w.dayOfWeek === dayOfWeek)?.status ?? "vai_normal";
      return {
        id: student.id,
        name: student.name,
        email: student.email,
        phone: student.phone,
        photoUrl: student.photoUrl,
        classId: student.classId,
        className: (student as any).class?.name ?? "",
        todayStatus: student.dailyStatuses[0]?.status ?? weeklyDefault,
        isBoarded: Boolean(student.dailyStatuses[0]?.boardedAt),
      };
    });
  },

  async listActiveByDriver(driverId: string, classId?: string) {
    if (classId) {
      const targetClass = await classRepository.findByIdAndDriver(classId, driverId);
      if (!targetClass) {
        throw new AppError("Turma não encontrada.", StatusCodeHttp.NOT_FOUND);
      }
    }
    const students = await studentRepository.listActiveByDriver(driverId, classId);
    return students.map(({ passwordHash, ...rest }) => rest);
  },

  /** Se driverId for informado, lista só os alunos daquela van; sem ele (admin), lista todos. */
  async listByStatus(status: string, driverId?: string, classId?: string) {
    if (status !== "true" && status !== "false") {
      throw new AppError("Status inválido.", StatusCodeHttp.BAD_REQUEST);
    }
    const active = status === "true";
    if (driverId) {
      if (classId) {
        const targetClass = await classRepository.findByIdAndDriver(classId, driverId);
        if (!targetClass) {
          throw new AppError("Turma não encontrada.", StatusCodeHttp.NOT_FOUND);
        }
      }
      return studentRepository.listByDriverAndActive(driverId, active, classId);
    }
    const students = active ? await studentRepository.listActiveAll() : await studentRepository.listDisableAll();
    return students.map(({ passwordHash, ...rest }) => rest);
  },

  async findById(id: string) {
    const student = await studentRepository.findById(id);
    if (!student) {
      throw new AppError("Aluno não encontrado.", StatusCodeHttp.NOT_FOUND);
    }
    const { passwordHash, ...safe } = student;
    return safe;
  },

  async getProfile(id: string) {
    const student = await studentRepository.findById(id);
    if (!student) {
      throw new AppError("Aluno não encontrado.", StatusCodeHttp.NOT_FOUND);
    }
    return {
      id: student.id,
      name: student.name,
      email: student.email,
      phone: student.phone,
      photoUrl: student.photoUrl,
      classId: student.classId,
      className: (student as any).class?.name ?? "",
      driverId: student.driverId,
      driverName: student.driver?.name ?? "Motorista",
      driverPhotoUrl: student.driver?.photoUrl ?? null,
      driverPhone: student.driver?.phone ?? null,
    };
  },

  async updatePhoto(id: string, photoUrl: string | null) {
    const student = await studentRepository.findById(id);
    if (!student) {
      throw new AppError("Aluno não encontrado.", StatusCodeHttp.NOT_FOUND);
    }
    if (photoUrl) {
      if (photoUrl.length > MAX_PHOTO_CHARS) {
        throw new AppError("A imagem selecionada é muito grande. Escolha uma foto menor.", StatusCodeHttp.BAD_REQUEST);
      }
      const match = PHOTO_REGEX.exec(photoUrl);
      if (!match || !hasValidImageSignature(match[1], match[2])) {
        throw new AppError("Formato de imagem inválido. Envie uma imagem JPEG, PNG ou WEBP.", StatusCodeHttp.BAD_REQUEST);
      }
    }
    const updated = await studentRepository.updatePhoto(id, photoUrl);
    return {
      id: updated.id,
      name: updated.name,
      photoUrl: updated.photoUrl,
    };
  },

  async updatePhone(id: string, phone: string | null) {
    const student = await studentRepository.findById(id);
    if (!student) {
      throw new AppError("Aluno não encontrado.", StatusCodeHttp.NOT_FOUND);
    }
    const cleanPhone = phone ? phone.trim() : null;
    const updated = await studentRepository.updatePhone(id, cleanPhone);
    return {
      id: updated.id,
      name: updated.name,
      phone: updated.phone,
    };
  },

  async updateClass(id: string, classId: string, driverId: string) {
    await this.assertBelongsToDriver(id, driverId);
    const targetClass = await classRepository.findByIdAndDriver(classId, driverId);
    if (!targetClass) {
      throw new AppError("Turma de destino não encontrada.", StatusCodeHttp.NOT_FOUND);
    }
    return studentRepository.updateClass(id, classId);
  },
};
