import { classRepository } from "../repositories/class.repository";
import { studentRepository } from "../repositories/student.repository";
import { AppError } from "../middlewares/errorHandler.middleware";
import { StatusCodeHttp } from "../utils/statusCodeHttp";

export const classService = {
  async create(driverId: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new AppError("O nome da turma é obrigatório.", StatusCodeHttp.BAD_REQUEST);
    }
    return classRepository.create(driverId, trimmed);
  },

  async listByDriver(driverId: string) {
    const classes = await classRepository.listByDriver(driverId);
    return classes.map((c) => ({
      id: c.id,
      name: c.name,
      createdAt: c.createdAt,
      studentCount: c._count.students,
    }));
  },

  async getById(driverId: string, id: string) {
    const classItem = await classRepository.findByIdAndDriver(id, driverId);
    if (!classItem) {
      throw new AppError("Turma não encontrada.", StatusCodeHttp.NOT_FOUND);
    }
    return classItem;
  },

  async update(driverId: string, id: string, name: string) {
    const trimmed = name.trim();
    if (!trimmed) {
      throw new AppError("O nome da turma é obrigatório.", StatusCodeHttp.BAD_REQUEST);
    }

    const existing = await classRepository.findByIdAndDriver(id, driverId);
    if (!existing) {
      throw new AppError("Turma não encontrada.", StatusCodeHttp.NOT_FOUND);
    }

    return classRepository.update(id, trimmed);
  },

  async delete(driverId: string, id: string) {
    const existing = await classRepository.findByIdAndDriver(id, driverId);
    if (!existing) {
      throw new AppError("Turma não encontrada.", StatusCodeHttp.NOT_FOUND);
    }

    const totalClasses = await classRepository.countByDriver(driverId);
    if (totalClasses <= 1) {
      throw new AppError(
        "Você não pode excluir sua única turma. O motorista precisa manter ao menos uma turma ativa.",
        StatusCodeHttp.BAD_REQUEST
      );
    }

    const activeStudents = await classRepository.countActiveStudents(id);
    if (activeStudents > 0) {
      throw new AppError(
        "Esta turma possui alunos ativos cadastrados. Mova ou exclua os alunos antes de excluir a turma.",
        StatusCodeHttp.BAD_REQUEST
      );
    }

    const otherClass = await classRepository.findFirstOtherClass(id, driverId);
    if (otherClass) {
      await studentRepository.moveAllStudentsClass(id, otherClass.id);
    }

    return classRepository.delete(id);
  },
};
