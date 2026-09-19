import { announcementRepository } from "../repositories/announcement.repository";
import { studentRepository } from "../repositories/student.repository";
import { pushService } from "./push.service";

export const announcementService = {
  /** RF05: motorista publica um aviso (via única, sem resposta dentro do app). */
  async publish(driverId: string, message: string) {
    const announcement = await announcementRepository.create(driverId, message);

    const students = await studentRepository.listActiveByDriver(driverId);
    await pushService.notifyStudents(
      students.map((s) => s.id),
      { title: "Aviso do motorista", body: message },
    );

    return announcement;
  },

  list(driverId: string) {
    return announcementRepository.listRecentByDriver(driverId);
  },
};
