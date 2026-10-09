import { z } from "zod";
import { emailSchema, passwordSchema } from "./common.schema";

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
    phone: z.string().min(11, "Telefone inválido").max(12, "Telefone muito longo").optional().nullable(),
  }),
});

export const createStudentSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Nome inválido").max(100, "Nome muito longo"),
    email: emailSchema,
    password: passwordSchema,
    driverId: z.uuid("ID do motorista inválido"),
    classId: z.uuid("ID da turma inválido"),
  }),
});
