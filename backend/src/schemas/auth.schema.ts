import { z } from "zod";
import { emailSchema } from "./common.schema";

export const loginSchema = z.object({
  body: z.object({
    email: emailSchema,
    password: z.string().min(1, "A senha é obrigatória").max(100, "A senha é muito longa"),
  }),
});
