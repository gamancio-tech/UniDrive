/// <reference lib="webworker" />
import { precacheAndRoute } from "workbox-precaching";

declare let self: ServiceWorkerGlobalScope;

// Ponto de injeção obrigatório para a estratégia "injectManifest" do vite-plugin-pwa —
// não remover este comentário nem a chamada abaixo.
precacheAndRoute(self.__WB_MANIFEST);

// Trata a notificação push recebida (RF03: contador de faltantes; RF05: mural de avisos).
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const payload = event.data.json() as {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    tag?: string;
    url?: string;
  };

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      // Ícone colorido grande exibido à direita/corpo da notificação
      icon: payload.icon || "/icons/icon-192.png",
      // Badge monocromático com fundo transparente para a barra de status do Android (evita quadrado branco)
      badge: payload.badge || "/icons/badge-72.png",
      tag: payload.tag || "unidrive-notification",
      data: {
        url: payload.url || "/",
      },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow("/");
      }
    }),
  );
});

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
