import { z } from "zod";

// --- Auth Schemas ---
export const loginSchema = z.object({
  body: z.object({
    email: z.email("Formato de e-mail inválido").max(100, "O e-mail é muito longo"),
    password: z.string().min(1, "A senha é obrigatória").max(100, "A senha é muito longa"),
  }),
});

// --- Admin/User Creation Schemas ---
export const createAdminSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres").max(100, "Nome muito longo"),
    email: z.email("E-mail inválido").max(100, "E-mail muito longo"),
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres").max(100, "Senha muito longa"),
  }),
});

export const createDriverSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Nome inválido").max(100, "Nome muito longo"),
    email: z.email("E-mail inválido").max(100, "E-mail muito longo"),
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres").max(100, "Senha muito longa"),
    pixKey: z.string().max(100, "Chave Pix muito longa").optional().nullable(),
    phone: z.string().max(20, "Telefone muito longo").optional().nullable(),
  }),
});

export const createStudentSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Nome inválido").max(100, "Nome muito longo"),
    email: z.email("E-mail inválido").max(100, "E-mail muito longo"),
    password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres").max(100, "Senha muito longa"),
    driverId: z.uuid("ID do motorista inválido"),
  }),
});

// --- Daily Status Schemas ---
export const updateDailyStatusSchema = z.object({
  body: z.object({
    status: z.enum(["vai_normal", "so_ida", "so_volta", "nao_vai"], {
      message: "Status inválido"
    }),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD"),
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
    endpoint: z.string().url("Endpoint URL inválido").max(1000, "Endpoint muito longo"),
    keys: z.object({
      p256dh: z.string().max(500, "Key p256dh muito longa"),
      auth: z.string().max(500, "Key auth muito longa"),
    }),
  }),
});

export const createStudentByDriverSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres").max(100, "Nome muito longo"),
    email: z.email("E-mail inválido").max(100, "E-mail muito longo"),
    temporaryPassword: z.string().min(6, "Senha provisória muito curta").max(100, "Senha muito longa"),
    phone: z.string().max(20, "Telefone muito longo").optional().nullable(),
  }),
});

export const updateSchedulesSchema = z.object({
  body: z.object({
    schedules: z.array(z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      tripType: z.enum(["so_ida", "so_volta", "ida_e_volta", "nao_vai"]),
    })),
  }),
});
