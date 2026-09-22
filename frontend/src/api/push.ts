import { apiRequest } from "./client";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

/**
 * Pede permissão de notificação e inscreve o navegador atual no Web Push (RF03/RF05).
 * Chame isso depois do login, uma vez por dispositivo.
 */
export async function subscribeToPush() {
  if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
    console.warn("Este navegador não suporta notificações push.");
    return;
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") return;

  const registration = await navigator.serviceWorker.ready;
  const { publicKey } = await apiRequest<{ publicKey: string }>("/push/public-key");

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(publicKey),
  });

  const json = subscription.toJSON();
  await apiRequest("/push/subscribe", {
    method: "POST",
    body: { endpoint: json.endpoint, keys: json.keys },
  });
}
