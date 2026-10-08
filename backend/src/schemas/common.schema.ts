import { z } from "zod";

/**
 * Validador para data real no formato YYYY-MM-DD, entre ontem e 60 dias à frente.
 */
export const dateOnly = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data deve estar no formato YYYY-MM-DD")
  .refine((value) => {
    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) return false;
    const diffDays = (date.getTime() - Date.now()) / 86_400_000;
    return diffDays >= -1.5 && diffDays <= 60;
  }, "Data inválida ou fora do período permitido");

/**
 * Validador de e-mail com sanitização (trim + lowercase).
 */
export const emailSchema = z
  .email("Formato de e-mail inválido")
  .max(100, "O e-mail é muito longo")
  .transform((v) => v.trim().toLowerCase());

/**
 * Validador de senha segura (mínimo 8 caracteres).
 */
export const passwordSchema = z
  .string()
  .min(8, "A senha deve ter no mínimo 8 caracteres")
  .max(100, "Senha muito longa");

/**
 * Validador de formato de telefone.
 */
export const phone = z
  .string()
  .trim()
  .regex(/^[\d+()\-\s.]{8,20}$/, "Telefone inválido");

/**
 * Validador de parâmetro :id genérico (UUID).
 */
export const idParamSchema = z.object({
  params: z.object({ id: z.uuid("ID inválido") }),
});

/**
 * Validador de query status booleano em string.
 */
export const statusQuerySchema = z.object({
  query: z.object({
    status: z.enum(["true", "false"]).optional(),
  }),
});
