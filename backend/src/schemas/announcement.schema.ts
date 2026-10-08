import { z } from "zod";

export const publishAnnouncementSchema = z.object({
  body: z.object({
    message: z.string().trim().min(1, "A mensagem é obrigatória").max(500, "Mensagem muito longa (máx. 500 caracteres)"),
    classIds: z.array(z.uuid("ID de turma inválido")).min(1, "Selecione ao menos uma turma"),
  }),
});
