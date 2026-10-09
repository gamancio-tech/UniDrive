import { z } from "zod";
import { emailSchema } from "./common.schema";

export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(8, "A senha deve ter pelo menos 8 caracteres").max(100, "A senha é muito longa"),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: emailSchema,
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    token: z.string().min(10, "Token inválido"),
    password: z.string().min(8, "A nova senha deve ter pelo menos 8 caracteres").max(100, "A senha é muito longa"),
  }),
});
