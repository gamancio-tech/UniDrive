import { z } from "zod";
import { emailSchema, passwordSchema, phone } from "./common.schema";

export const createStudentByDriverSchema = z.object({
  body: z.object({
    name: z.string().min(2, "Nome deve ter no mínimo 2 caracteres").max(100, "Nome muito longo"),
    email: emailSchema,
    temporaryPassword: passwordSchema,
    phone: z.string().max(20, "Telefone muito longo").optional().nullable(),
    classId: z.uuid("ID da turma inválido"),
  }),
});

export const updateStudentProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    email: z.email().max(100).optional(),
    phone: z.string().max(20).optional().nullable(),
    temporaryPassword: z.string().max(100).optional().nullable(),
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

export const updatePhoneSchema = z.object({
  body: z.object({ phone }),
});

export const updatePhotoSchema = z.object({
  body: z.object({
    // O conteúdo real (tipo e assinatura da imagem) é verificado no service.
    photoUrl: z.string().max(150_000, "Imagem muito grande").nullable().optional(),
  }),
});

export const studentIdParamSchema = z.object({
  params: z.object({ studentId: z.uuid("ID inválido") }),
});

export const listStudentsQuerySchema = z.object({
  query: z.object({
    status: z.enum(["true", "false"]).optional(),
    classId: z.uuid("ID de turma inválido").optional(),
  }),
});

export const updateStudentClassSchema = z.object({
  body: z.object({
    classId: z.uuid("ID da turma inválido"),
  }),
});

