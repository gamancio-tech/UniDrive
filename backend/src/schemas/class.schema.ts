import { z } from "zod";

export const createClassSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, "Nome da turma deve ter no mínimo 2 caracteres").max(100, "Nome muito longo"),
  }),
});

export const updateClassSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, "Nome da turma deve ter no mínimo 2 caracteres").max(100, "Nome muito longo"),
  }),
});

export const classIdParamSchema = z.object({
  params: z.object({ id: z.uuid("ID da turma inválido") }),
});

export const classQuerySchema = z.object({
  query: z.object({
    classId: z.uuid("ID da turma inválido").optional(),
  }),
});
