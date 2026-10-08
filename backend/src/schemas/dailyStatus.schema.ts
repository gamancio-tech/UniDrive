import { z } from "zod";
import { dateOnly } from "./common.schema";

export const updateDailyStatusSchema = z.object({
  body: z.object({
    status: z.enum(["vai_normal", "so_ida", "so_volta", "nao_vai"], {
      message: "Status inválido",
    }),
    date: dateOnly,
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
    classId: z.uuid("ID de turma inválido").optional(),
  }),
});

export const resetAllBoardedSchema = z.object({
  query: z.object({
    classId: z.uuid("ID de turma inválido").optional(),
  }).optional(),
  body: z.object({
    classId: z.uuid("ID de turma inválido").optional(),
  }).optional(),
});

