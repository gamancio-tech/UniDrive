import { tripCancellationRepository } from "../repositories/tripCancellation.repository";
import { classRepository } from "../repositories/class.repository";
import { studentRepository } from "../repositories/student.repository";
import { pushService } from "./push.service";
import { AppError } from "../middlewares/errorHandler.middleware";
import { StatusCodeHttp } from "../utils/statusCodeHttp";

function toDateOnly(date: Date): Date {
  return new Date(date.toISOString().slice(0, 10));
}

export const tripCancellationService = {
  /** RF06: motorista cancela o dia para uma ou mais turmas. */
  async cancelDay(driverId: string, classIds: string[], date: Date, reason?: string) {
    if (!classIds || classIds.length === 0) {
      throw new AppError("Selecione ao menos uma turma para cancelar.", StatusCodeHttp.BAD_REQUEST);
    }

    // Validação BOLA: todas as turmas devem pertencer ao motorista
    for (const classId of classIds) {
      const cls = await classRepository.findByIdAndDriver(classId, driverId);
      if (!cls) {
        throw new AppError("Turma não encontrada.", StatusCodeHttp.NOT_FOUND);
      }
    }

    const normalizedDate = toDateOnly(date);

    const createdCancellations = await Promise.all(
      classIds.map((classId) =>
        tripCancellationRepository.create(driverId, classId, normalizedDate, reason)
      )
    );

    // Coleta IDs dos alunos das turmas afetadas para envio do push
    const affectedStudents = await Promise.all(
      classIds.map((classId) => studentRepository.listActiveByDriver(driverId, classId))
    );
    const studentIds = Array.from(new Set(affectedStudents.flat().map((s) => s.id)));

    if (studentIds.length > 0) {
      const body = reason
        ? `A viagem de hoje foi cancelada: ${reason}`
        : "A viagem de hoje foi cancelada pelo motorista.";

      pushService
        .notifyStudents(studentIds, {
          title: "Viagem Cancelada",
          body,
        })
        .catch((err) => console.error("Erro ao disparar push de cancelamento:", err));
    }

    return createdCancellations;
  },

  /** RF06: motorista desfaz o cancelamento para uma ou mais turmas. */
  async uncancelDay(driverId: string, classIds: string[], date: Date) {
    if (!classIds || classIds.length === 0) {
      throw new AppError("Selecione ao menos uma turma para descancelar.", StatusCodeHttp.BAD_REQUEST);
    }

    for (const classId of classIds) {
      const cls = await classRepository.findByIdAndDriver(classId, driverId);
      if (!cls) {
        throw new AppError("Turma não encontrada.", StatusCodeHttp.NOT_FOUND);
      }
    }

    const normalizedDate = toDateOnly(date);
    await tripCancellationRepository.deleteManyByClasses(driverId, classIds, normalizedDate);

    // Notifica os alunos das turmas reativadas
    const affectedStudents = await Promise.all(
      classIds.map((classId) => studentRepository.listActiveByDriver(driverId, classId))
    );
    const studentIds = Array.from(new Set(affectedStudents.flat().map((s) => s.id)));

    if (studentIds.length > 0) {
      pushService
        .notifyStudents(studentIds, {
          title: "Viagem Reativada",
          body: "A viagem de hoje foi restabelecida pelo motorista.",
        })
        .catch((err) => console.error("Erro ao disparar push de reativação:", err));
    }

    return { success: true };
  },

  async isClassCancelled(classId: string, date: Date) {
    const cancellation = await tripCancellationRepository.findByClassAndDate(classId, toDateOnly(date));
    return Boolean(cancellation);
  },
};
