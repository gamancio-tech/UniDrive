import { NextFunction, Request, Response } from "express";
import { StatusCodeHttp } from "../utils/statusCodeHttp";

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = StatusCodeHttp.BAD_REQUEST,
  ) {
    super(message);
  }
}

/**
 * Middleware de erro do Express (precisa ter 4 argumentos para ser reconhecido como tal).
 * Controllers devem chamar next(err) em vez de lidar com a resposta de erro diretamente.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandlerMiddleware(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  if (err instanceof SyntaxError && "status" in err && (err as { status: number }).status === 400) {
    return res.status(StatusCodeHttp.BAD_REQUEST).json({ error: "Formato JSON inválido no corpo da requisição." });
  }

  console.error(err);
  return res.status(StatusCodeHttp.INTERNAL_SERVER_ERROR).json({ error: "Erro interno do servidor." });
}
