import { z } from "zod";
import { dateOnly } from "./common.schema";

export const cancelTripSchema = z.object({
  body: z.object({
    date: dateOnly.optional(),
    reason: z.string().max(200, "Motivo muito longo").optional(),
    classIds: z.array(z.uuid("ID de turma inválido")).min(1, "Selecione ao menos uma turma"),
  }),
});

export const uncancelTripSchema = z.object({
  body: z.object({
    date: dateOnly.optional(),
    classIds: z.array(z.uuid("ID de turma inválido")).min(1, "Selecione ao menos uma turma").optional(),
  }).optional(),
  query: z.object({
    date: dateOnly.optional(),
    classId: z.uuid("ID de turma inválido").optional(),
  }).optional(),
});
