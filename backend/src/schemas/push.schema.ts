import { z } from "zod";

/** Hosts oficiais dos serviços de push dos navegadores. Qualquer outro host é recusado (anti-SSRF). */
export const PUSH_HOST_SUFFIXES = [
  "fcm.googleapis.com",
  "android.googleapis.com",
  "push.services.mozilla.com",
  "notify.windows.com",
  "push.apple.com",
];

export function isAllowedPushEndpoint(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.port) return false;
    return PUSH_HOST_SUFFIXES.some((suffix) => url.hostname === suffix || url.hostname.endsWith(`.${suffix}`));
  } catch {
    return false;
  }
}

export const pushEndpoint = z
  .string()
  .max(1000, "Endpoint muito longo")
  .refine(isAllowedPushEndpoint, "Endpoint de push não permitido");

export const savePushSubscriptionSchema = z.object({
  body: z.object({
    endpoint: pushEndpoint,
    keys: z.object({
      p256dh: z.string().max(500, "Key p256dh muito longa"),
      auth: z.string().max(500, "Key auth muito longa"),
    }),
  }),
});

export const unsubscribePushSchema = z.object({
  body: z.object({
    endpoint: z.string().max(1000).optional(),
  }),
});
