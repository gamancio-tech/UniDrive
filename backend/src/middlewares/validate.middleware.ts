import { Request, Response, NextFunction } from "express";
import { ZodError, ZodType } from "zod";
import { StatusCodeHttp } from "../utils/statusCodeHttp";

export const validate = (schema: ZodType) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map((e) => `${e.path.join(".")}: ${e.message}`);
        return res.status(StatusCodeHttp.BAD_REQUEST).json({
          error: "Erro de validação nos dados enviados.",
          details,
        });
      }
      return next(error);
    }
  };
};
