import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AuthenticatedUser } from "../types/express";
import { StatusCodeHttp } from "../utils/statusCodeHttp";
import { isAccountActive } from "../lib/accountStatus";

const ROLES = ["driver", "student", "admin"];

/**
 * Verifica o token JWT enviado no header "Authorization: Bearer <token>"
 * e popula req.user. Use em qualquer rota que exija login.
 */
export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    return res.status(StatusCodeHttp.UNAUTHORIZED).json({ error: "Token de autenticação ausente." });
  }

  const token = header.slice("Bearer ".length);

  let payload: AuthenticatedUser;
  try {
    // Fixa o algoritmo para evitar troca de algoritmo no token.
    payload = jwt.verify(token, env.jwtSecret, { algorithms: ["HS256"] }) as AuthenticatedUser;
  } catch {
    return res.status(StatusCodeHttp.UNAUTHORIZED).json({ error: "Token inválido ou expirado." });
  }

  if (!payload || typeof payload.id !== "string" || !ROLES.includes(payload.role)) {
    return res.status(StatusCodeHttp.UNAUTHORIZED).json({ error: "Token inválido ou expirado." });
  }

  try {
    // Conta desativada ou removida não pode mais usar um token ainda válido.
    if (!(await isAccountActive(payload.role, payload.id))) {
      return res.status(StatusCodeHttp.UNAUTHORIZED).json({ error: "Conta desativada ou inexistente." });
    }
  } catch (err) {
    return next(err);
  }

  req.user = payload;
  next();
}

/**
 * Restringe o acesso a um papel específico (ex.: só motorista).
 * Deve ser usado depois do authMiddleware.
 */
export function requireRole(role: AuthenticatedUser["role"]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.user?.role !== role) {
      return res.status(StatusCodeHttp.FORBIDDEN).json({ error: "Acesso não permitido para este perfil." });
    }
    next();
  };
}

/**
 * Restringe o acesso exclusivamente ao Super Administrador.
 * Deve ser usado depois do authMiddleware.
 */
export function requireSuperAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== "admin" || !req.user.isSuperAdmin) {
    return res.status(StatusCodeHttp.FORBIDDEN).json({
      error: "Apenas o Super Administrador tem permissão para esta ação.",
    });
  }
  next();
}
