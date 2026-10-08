import { apiRequest } from "./client";

export interface Announcement {
  id: string;
  driverId: string;
  classId?: string;
  class?: {
    id: string;
    name: string;
  };
  message: string;
  createdAt: string;
}

/**
 * Busca a lista de anúncios recentes vinculados ao motorista (estudante ou motorista).
 */
export async function getAnnouncements(classId?: string): Promise<Announcement[]> {
  const query = classId ? `?classId=${encodeURIComponent(classId)}` : "";
  return apiRequest<Announcement[]>(`/announcements${query}`);
}

/**
 * Publica um novo comunicado da van para uma ou mais turmas (apenas motorista).
 */
export async function publishAnnouncement(message: string, classIds: string[]): Promise<Announcement[]> {
  return apiRequest<Announcement[]>("/announcements", {
    method: "POST",
    body: { message, classIds },
  });
}
