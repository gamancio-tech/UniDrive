import { Request, Response, NextFunction } from "express";
import { ZodError, ZodType } from "zod";
import { StatusCodeHttp } from "../utils/statusCodeHttp";

export const validate = (schema: ZodType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = (await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      })) as { body?: unknown; query?: unknown; params?: unknown };

      // Substitui body, query e params pelos dados validados e tipados pelo Zod:
      // descarta campos desconhecidos e aplica coerções (ex: z.coerce.number).
      if (parsed.body !== undefined) {
        req.body = parsed.body;
      }

      if (parsed.query !== undefined && typeof parsed.query === "object" && parsed.query !== null) {
        try {
          req.query = parsed.query as any;
        } catch {
          Object.assign(req.query, parsed.query);
        }
      }

      if (parsed.params !== undefined && typeof parsed.params === "object" && parsed.params !== null) {
        try {
          req.params = parsed.params as any;
        } catch {
          Object.assign(req.params, parsed.params);
        }
      }

      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map((e) => `${e.path.join(".")}: ${e.message}`);
        const firstMessage = error.issues[0]?.message || "Erro de validação nos dados enviados.";
        return res.status(StatusCodeHttp.BAD_REQUEST).json({
          error: firstMessage,
          details,
        });
      }
      return next(error);
    }
  };
};
