import { apiRequest } from "./client";

function urlBase64ToUint8Array(base64String: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function isIosDevice(): boolean {
  return /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
}

export function isStandaloneApp(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    Boolean((window.navigator as unknown as { standalone?: boolean }).standalone)
  );
}

export interface PushStatus {
  supported: boolean;
  permission: NotificationPermission;
  isSubscribed: boolean;
  isIosNonStandalone: boolean;
}

/** Retorna o estado atual de suporte e permissão de push no dispositivo */
export async function getPushStatus(): Promise<PushStatus> {
  const isIos = isIosDevice();
  const standalone = isStandaloneApp();
  const isIosNonStandalone = isIos && !standalone;

  const supported =
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window &&
    !isIosNonStandalone;

  if (!supported) {
    return {
      supported: false,
      permission: typeof Notification !== "undefined" ? Notification.permission : "denied",
      isSubscribed: false,
      isIosNonStandalone,
    };
  }

  const permission = Notification.permission;
  let isSubscribed = false;

  try {
    const reg = await navigator.serviceWorker.getRegistration();
    if (reg) {
      const sub = await reg.pushManager.getSubscription();
      isSubscribed = Boolean(sub);
    }
  } catch {
    isSubscribed = false;
  }

  return {
    supported: true,
    permission,
    isSubscribed,
    isIosNonStandalone: false,
  };
}

/**
 * Pede permissão de notificação e inscreve o navegador atual no Web Push (RF03/RF05).
 * Deve ser chamado preferencialmente através de um clique de botão do usuário.
 */
export async function subscribeToPush(): Promise<{ success: boolean; message: string }> {
  const isIos = isIosDevice();
  const standalone = isStandaloneApp();

  if (isIos && !standalone) {
    throw new Error(
      "No iPhone, adicione o UniDrive à Tela de Início (Compartilhar ➔ Adicionar à Tela de Início) e abra por lá para ativar as notificações.",
    );
  }

  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
    throw new Error("Seu navegador atual não suporta notificações Web Push.");
  }

  if (Notification.permission === "denied") {
    throw new Error(
      "Notificações estão bloqueadas no seu navegador. Permita o envio nas configurações do site e tente novamente.",
    );
  }

  const permission = await Notification.requestPermission();
  if (permission !== "granted") {
    throw new Error("Permissão de notificações não foi concedida pelo usuário.");
  }

  let registration = await navigator.serviceWorker.getRegistration();
  if (!registration) {
    const swUrl = import.meta.env.DEV ? "/dev-sw.js?dev-sw" : "/sw.js";
    const swOptions = import.meta.env.DEV ? { type: "module" as const, scope: "/" } : { scope: "/" };
    registration = await navigator.serviceWorker.register(swUrl, swOptions);
  }
  registration = await navigator.serviceWorker.ready;

  const { publicKey } = await apiRequest<{ publicKey: string }>("/push/public-key");
  if (!publicKey) {
    throw new Error("Chave VAPID pública não configurada no servidor backend.");
  }

  let subscription = await registration.pushManager.getSubscription();
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(publicKey),
    });
  }

  const json = subscription.toJSON();
  if (!json.endpoint || !json.keys) {
    throw new Error("Dados de inscrição do navegador incompletos.");
  }

  await apiRequest("/push/subscribe", {
    method: "POST",
    body: { endpoint: json.endpoint, keys: json.keys },
  });

  return { success: true, message: "Notificações ativadas com sucesso!" };
}

/** Dispara uma notificação de teste para o próprio dispositivo atual */
export async function sendTestPush(): Promise<{ delivered: number; total: number }> {
  return apiRequest<{ delivered: number; total: number }>("/push/test", {
    method: "POST",
  });
}
