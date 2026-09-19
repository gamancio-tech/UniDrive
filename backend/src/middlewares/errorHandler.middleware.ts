import { NextFunction, Request, Response } from "express";

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400,
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

  console.error(err);
  return res.status(500).json({ error: "Erro interno do servidor." });
}
