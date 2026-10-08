import { announcementRepository } from "../repositories/announcement.repository";
import { studentRepository } from "../repositories/student.repository";
import { classRepository } from "../repositories/class.repository";
import { pushService } from "./push.service";
import { AppError } from "../middlewares/errorHandler.middleware";
import { StatusCodeHttp } from "../utils/statusCodeHttp";
import { AuthenticatedUser } from "../types/express";

export const announcementService = {
  /** RF05: motorista publica um aviso para uma ou mais turmas selecionadas. */
  async publish(driverId: string, message: string, classIds: string[]) {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      throw new AppError("A mensagem é obrigatória.", StatusCodeHttp.BAD_REQUEST);
    }

    if (!classIds || classIds.length === 0) {
      throw new AppError("Selecione ao menos uma turma para enviar o aviso.", StatusCodeHttp.BAD_REQUEST);
    }

    // Validação BOLA: todas as turmas informadas devem pertencer ao motorista
    for (const classId of classIds) {
      const cls = await classRepository.findByIdAndDriver(classId, driverId);
      if (!cls) {
        throw new AppError("Turma não encontrada.", StatusCodeHttp.NOT_FOUND);
      }
    }

    // Cria um registro de Announcement para cada turma selecionada
    const created = await Promise.all(
      classIds.map((classId) => announcementRepository.create(driverId, classId, trimmedMessage))
    );

    // Notifica os alunos das turmas afetadas
    const studentsByClasses = await Promise.all(
      classIds.map((classId) => studentRepository.listActiveByDriver(driverId, classId))
    );
    const studentIds = Array.from(new Set(studentsByClasses.flat().map((s) => s.id)));

    if (studentIds.length > 0) {
      pushService
        .notifyStudents(studentIds, {
          title: "Aviso do motorista",
          body: trimmedMessage,
        })
        .catch((err) => console.error("Erro ao disparar push de anúncio:", err));
    }

    return created;
  },

  async list(user: AuthenticatedUser, classIdQuery?: string) {
    if (user.role === "driver") {
      if (classIdQuery) {
        const cls = await classRepository.findByIdAndDriver(classIdQuery, user.id);
        if (!cls) {
          throw new AppError("Turma não encontrada.", StatusCodeHttp.NOT_FOUND);
        }
      }
      return announcementRepository.listRecentByDriver(user.id, classIdQuery);
    }

    if (user.role === "student") {
      const student = await studentRepository.findById(user.id);
      if (!student || !student.classId) {
        return [];
      }
      return announcementRepository.listRecentByClass(student.classId);
    }

    throw new AppError("Acesso não permitido.", StatusCodeHttp.FORBIDDEN);
  },
};
