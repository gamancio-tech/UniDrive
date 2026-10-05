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
    console.log(
      `[Push] Salvando inscrição push para: ${input.studentId ? `aluno ${input.studentId}` : input.driverId ? `motorista ${input.driverId}` : "admin"} (endpoint: ${input.endpoint.slice(0, 45)}...)`,
    );
    return pushSubscriptionRepository.save(input);
  },

  /** Remove inscrições do usuário autenticado (por endpoint específico ou todas as dele). */
  async unsubscribe(userId: string, endpoint?: string) {
    if (endpoint) {
      console.log(`[Push] Removendo inscrição do usuário ${userId} por endpoint.`);
      return pushSubscriptionRepository.deleteByEndpointAndUser(endpoint, userId);
    }
    console.log(`[Push] Removendo inscrições do usuário: ${userId}`);
    return pushSubscriptionRepository.deleteByUserId(userId);
  },

  /** Envia uma notificação a um conjunto de alunos (usado pelo RF03 e pelo mural, RF05). */
  async notifyStudents(
    studentIds: string[],
    payload: { title: string; body: string; icon?: string; badge?: string; tag?: string; url?: string }
  ) {
    console.log(`[Push] Disparando notificação para ${studentIds.length} aluno(s): "${payload.title}"`);
    const subscriptions = await pushSubscriptionRepository.listByStudentIds(studentIds);
    console.log(`[Push] Encontradas ${subscriptions.length} inscrição(ões) no banco para os alunos.`);

    if (subscriptions.length === 0) {
      console.warn("[Push] Nenhum aluno possui inscrição push ativa no banco.");
      return;
    }

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          const res = await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: sub.keys as unknown as { p256dh: string; auth: string },
            },
            JSON.stringify(payload),
          );
          console.log(`[Push] ✅ Entregue (${res.statusCode}) para endpoint: ${sub.endpoint.slice(0, 45)}...`);
          return res;
        } catch (err: unknown) {
          const statusCode = (err as { statusCode?: number })?.statusCode;
          console.error(`[Push] ❌ Falha ao enviar para ${sub.endpoint.slice(0, 45)}... Código: ${statusCode || err}`);
          if (statusCode === 410 || statusCode === 404) {
            console.log(`[Push] 🗑️ Removendo inscrição expirada do banco: ${sub.id}`);
            await pushSubscriptionRepository.deleteByEndpoint(sub.endpoint).catch(() => {});
          }
          throw err;
        }
      }),
    );

    const successCount = results.filter((r) => r.status === "fulfilled").length;
    console.log(`[Push] Envio finalizado: ${successCount}/${subscriptions.length} entregues com sucesso.`);
  },

  async notifyDriver(
    driverId: string,
    payload: { title: string; body: string; icon?: string; badge?: string; tag?: string; url?: string }
  ) {
    console.log(`[Push] Disparando notificação para motorista ${driverId}: "${payload.title}"`);
    const subscriptions = await pushSubscriptionRepository.listByDriverId(driverId);
    console.log(`[Push] Encontradas ${subscriptions.length} inscrição(ões) no banco para o motorista.`);

    if (subscriptions.length === 0) {
      console.warn("[Push] O motorista não possui inscrição push ativa no banco.");
      return;
    }

    const results = await Promise.allSettled(
      subscriptions.map(async (sub) => {
        try {
          const res = await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: sub.keys as unknown as { p256dh: string; auth: string },
            },
            JSON.stringify(payload),
          );
          console.log(`[Push] ✅ Entregue (${res.statusCode}) para endpoint: ${sub.endpoint.slice(0, 45)}...`);
          return res;
        } catch (err: unknown) {
          const statusCode = (err as { statusCode?: number })?.statusCode;
          console.error(`[Push] ❌ Falha ao enviar para ${sub.endpoint.slice(0, 45)}... Código: ${statusCode || err}`);
          if (statusCode === 410 || statusCode === 404) {
            console.log(`[Push] 🗑️ Removendo inscrição expirada do banco: ${sub.id}`);
            await pushSubscriptionRepository.deleteByEndpoint(sub.endpoint).catch(() => {});
          }
          throw err;
        }
      }),
    );

    const successCount = results.filter((r) => r.status === "fulfilled").length;
    console.log(`[Push] Envio finalizado: ${successCount}/${subscriptions.length} entregues ao motorista.`);
  },

  /** Dispara uma notificação de teste diretamente para o dispositivo do usuário atual */
  async sendTestNotification(userId: string, role: string) {
    const subscriptions =
      role === "driver"
        ? await pushSubscriptionRepository.listByDriverId(userId)
        : await pushSubscriptionRepository.listByStudentId(userId);

    if (subscriptions.length === 0) {
      throw new Error("Nenhuma inscrição push encontrada para este dispositivo no banco. Ative as notificações primeiro.");
    }

    const payload = {
      title: "UniDrive - Teste de Notificação",
      body: "Suas notificações estão configuradas e funcionando perfeitamente! 🚐🔔",
    };

    let delivered = 0;
    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: sub.keys as unknown as { p256dh: string; auth: string },
          },
          JSON.stringify(payload),
        );
        delivered++;
      } catch (err: unknown) {
        const statusCode = (err as { statusCode?: number })?.statusCode;
        if (statusCode === 410 || statusCode === 404) {
          await pushSubscriptionRepository.deleteByEndpoint(sub.endpoint).catch(() => {});
        }
      }
    }

    if (delivered === 0) {
      throw new Error("Inscrição expirada ou inválida no navegador. Tente desativar e reativar a notificação.");
    }

    return { delivered, total: subscriptions.length };
  },
};
