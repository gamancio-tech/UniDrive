/// <reference lib="webworker" />
import { precacheAndRoute } from "workbox-precaching";

declare let self: ServiceWorkerGlobalScope;

// Ponto de injeção obrigatório para a estratégia "injectManifest" do vite-plugin-pwa —
// não remover este comentário nem a chamada abaixo.
precacheAndRoute(self.__WB_MANIFEST);

// Trata a notificação push recebida (RF03: contador de faltantes; RF05: mural de avisos).
self.addEventListener("push", (event) => {
  if (!event.data) return;

  const payload = event.data.json() as { title: string; body: string };

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: "/icons/icon-192.png",
    }),
  );
});

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});
