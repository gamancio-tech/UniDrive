import { z } from "zod";

/** Hosts oficiais dos serviços de push dos navegadores. Qualquer outro host é recusado (anti-SSRF). */
const PUSH_HOST_SUFFIXES = [
  "fcm.googleapis.com",
  "android.googleapis.com",
  "push.services.mozilla.com",
  "notify.windows.com",
  "push.apple.com",
];

function isAllowedPushEndpoint(value: string): boolean {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.port) return false;
    return PUSH_HOST_SUFFIXES.some((suffix) => url.hostname === suffix || url.hostname.endsWith(`.${suffix}`));
  } catch {
    return false;
  }
}

const pushEndpoint = z
  .string()
  .max(1000, "Endpoint muito longo")
  .refine(isAllowedPushEndpoint, "Endpoint de push não permitido");

/** Data real no formato YYYY-MM-DD, entre ontem e 60 dias à frente. */
const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return false;
    const diffDays = (date.getTime() - Date.now()) / 86_400_000;
    return diffDays >= -1.5 && diffDays <= 60;
  }, "Data inválida ou fora do período permitido");

const emailSchema = z
  .email("Formato de e-mail inválido")
  .max(100, "O e-mail é muito longo")
  .transform((v) => v.trim().toLowerCase());

const passwordSchema = z
  .string()
  .min(8, "A senha deve ter no mínimo 8 caracteres")
  .max(100, "Senha muito longa");

// --- Auth Schemas ---
export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1, "A senha é obrigatória").max(100, "A senha é muito longa"),
  }),
});

// --- Admin/User Creation Schemas ---
export const createAdminSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres").max(100, "Nome muito longo"),
    email: emailSchema,
    password: passwordSchema,
  }),
});

export const createDriverSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Nome inválido").max(100, "Nome muito longo"),
    email: emailSchema,
    password: passwordSchema,
    pixKey: z.string().max(100, "Chave Pix muito longa").optional().nullable(),
    phone: z.string().max(20, "Telefone muito longo").optional().nullable(),
  }),
});

export const createStudentSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Nome inválido").max(100, "Nome muito longo"),
    email: emailSchema,
    password: passwordSchema,
    driverId: z.uuid("ID do motorista inválido"),
  }),
});

// --- Daily Status Schemas ---
export const updateDailyStatusSchema = z.object({
  body: z.object({
    status: z.enum(["vai_normal", "so_ida", "so_volta", "nao_vai"], {
      message: "Status inválido"
    }),
    date: dateOnly,
  }),
});

// --- Student App Schemas ---
export const updateStudentProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    email: z.email().max(100).optional(),
    phone: z.string().max(20).optional().nullable(),
    temporaryPassword: z.string().max(100).optional().nullable(),
  }),
});

// --- Push Notifications Schemas ---
export const savePushSubscriptionSchema = z.object({
  body: z.object({
    endpoint: pushEndpoint,
    keys: z.object({
      p256dh: z.string().max(500, "Key p256dh muito longa"),
      auth: z.string().max(500, "Key auth muito longa"),
    }),
  }),
});

export const createStudentByDriverSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres").max(100, "Nome muito longo"),
    email: emailSchema,
    temporaryPassword: passwordSchema,
    phone: z.string().max(20, "Telefone muito longo").optional().nullable(),
  }),
});

export const updateSchedulesSchema = z.object({
  body: z.object({
    schedules: z.array(z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      tripType: z.enum(["so_ida", "so_volta", "ida_e_volta", "nao_vai"]),
    })).max(7, "No máximo 7 dias"),
  }),
});

// --- Novos schemas (auditoria de segurança) ---
export const unsubscribePushSchema = z.object({
  body: z.object({
    endpoint: z.string().max(1000).optional(),
  }),
});

export const publishAnnouncementSchema = z.object({
  body: z.object({
    message: z.string().trim().min(1, "A mensagem é obrigatória").max(500, "Mensagem muito longa (máx. 500 caracteres)"),
  }),
});

const phone = z.string().trim().regex(/^[\d+()\-\s.]{8,20}$/, "Telefone inválido");

export const updatePhoneSchema = z.object({
  body: z.object({ phone }),
});

export const updatePhotoSchema = z.object({
  body: z.object({
    // O conteúdo real (tipo e assinatura da imagem) é verificado no service.
    photoUrl: z.string().max(150_000, "Imagem muito grande").nullable().optional(),
  }),
});

export const setTripStateSchema = z.object({
  body: z.object({
    trip: z.enum(["ida", "volta"]).optional(),
    step: z.enum(["aguardando", "em_viagem", "finalizada"]).optional(),
  }),
});

export const missingCountSchema = z.object({
  query: z.object({
    trip: z.enum(["ida", "volta"]).optional(),
  }),
});

export const studentIdParamSchema = z.object({
  params: z.object({ studentId: z.uuid("ID inválido") }),
});

export const idParamSchema = z.object({
  params: z.object({ id: z.uuid("ID inválido") }),
});

export const statusQuerySchema = z.object({
  query: z.object({
    status: z.enum(["true", "false"]).optional(),
  }),
});

// ---- Chat ----
export const chatHistorySchema = z.object({
  params: z.object({ partnerId: z.uuid("ID inválido") }),
  query: z.object({
    limit: z.coerce.number().int().min(1).max(100).optional(),
    beforeId: z.uuid("ID inválido").optional(),
  }),
});

export const chatPartnerParamSchema = z.object({
  params: z.object({ partnerId: z.uuid("ID inválido") }),
});

export const deleteChatMessageSchema = z.object({
  params: z.object({ id: z.uuid("ID inválido") }),
  query: z.object({
    scope: z.enum(["me", "everyone"]).default("me"),
  }),
});

// Payloads recebidos pelo WebSocket do chat (não passam pelo middleware validate).
export const wsSendMessagePayloadSchema = z.object({
  recipientId: z.string().max(64).optional(),
  content: z.string().min(1).max(1000),
  tempId: z.string().max(64).optional(),
});

export const wsMarkAsReadPayloadSchema = z.object({
  conversationWith: z.uuid("ID inválido"),
});
