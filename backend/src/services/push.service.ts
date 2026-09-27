import webpush from "web-push";
import { env } from "../config/env";
import { pushSubscriptionRepository } from "../repositories/pushSubscription.repository";

webpush.setVapidDetails(env.vapid.contactEmail, env.vapid.publicKey, env.vapid.privateKey);

export const pushService = {
  publicKey: env.vapid.publicKey,

  async saveSubscription(input: {
    endpoint: string;
    keys: { p256dh: string; auth: string };
    studentId?: string;
    driverId?: string;
    adminId?: string;
  }) {
    return pushSubscriptionRepository.save(input);
  },

  /** Envia uma notificação a um conjunto de alunos (usado pelo RF03 e pelo mural, RF05). */
  async notifyStudents(studentIds: string[], payload: { title: string; body: string }) {
    const subscriptions = await pushSubscriptionRepository.listByStudentIds(studentIds);
    await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys as unknown as { p256dh: string; auth: string },
          },
          JSON.stringify(payload),
        ),
      ),
    );
  },

  async notifyDriver(driverId: string, payload: { title: string; body: string }) {
    const subscriptions = await pushSubscriptionRepository.listByDriverId(driverId);
    await Promise.allSettled(
      subscriptions.map((sub) =>
        webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys as unknown as { p256dh: string; auth: string },
          },
          JSON.stringify(payload),
        ),
      ),
    );
  },
};
