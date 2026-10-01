import { apiRequest } from "./client";

export interface Announcement {
  id: string;
  driverId: string;
  message: string;
  createdAt: string;
}

/**
 * Busca a lista de anúncios recentes vinculados ao motorista (estudante ou motorista).
 */
export async function getAnnouncements(): Promise<Announcement[]> {
  return apiRequest<Announcement[]>("/announcements");
}

/**
 * Publica um novo comunicado da van (apenas motorista).
 */
export async function publishAnnouncement(message: string): Promise<Announcement> {
  return apiRequest<Announcement>("/announcements", {
    method: "POST",
    body: { message },
  });
}
