import rateLimit from "express-rate-limit";
import { Request } from "express";

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500, // limite de 500 requisições por janela
  message: { error: "Muitas requisições efetuadas. Aguarde um instante." },
  keyGenerator: (req: Request) => {
    if (req.user && req.user.id) {
      return req.user.id;
    }
    return req.ip || "unknown-ip";
  },
  validate: { xForwardedForHeader: false, default: true },
});

// Limita tentativas brutas por endereço IP (anti-spray)
const authIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: "Muitas tentativas a partir deste IP. Tente novamente após 15 minutos." },
  keyGenerator: (req: Request) => req.ip || "unknown-ip",
  validate: { xForwardedForHeader: false, default: true },
});

// Limita tentativas brutas por conta de e-mail (anti-brute-force distribuído)
const authEmailLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { error: "Muitas tentativas de acesso para esta conta. Tente novamente após 15 minutos." },
  keyGenerator: (req: Request) => {
    const raw = req.body?.email;
    const email = typeof raw === "string" ? raw.trim().toLowerCase() : "unknown-email";
    return `email_${email}`;
  },
  validate: { xForwardedForHeader: false, default: true },
});

export const authLimiter = [authIpLimiter, authEmailLimiter];

// Limita exclusão pontual de mensagens (máx. 30 por minuto por usuário)
export const chatDeletionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 30,
  message: { error: "Muitas exclusões de mensagens solicitadas em pouco tempo. Aguarde um instante." },
  keyGenerator: (req: Request) => {
    if (req.user && req.user.id) {
      return `chat_del_${req.user.id}`;
    }
    return req.ip || "unknown-ip";
  },
  validate: { xForwardedForHeader: false, default: true },
});

// Limita limpeza completa de histórico de conversa (máx. 5 por minuto por usuário)
export const chatClearLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 5,
  message: { error: "Muitas solicitações para limpar histórico. Aguarde um minuto." },
  keyGenerator: (req: Request) => {
    if (req.user && req.user.id) {
      return `chat_clear_${req.user.id}`;
    }
    return req.ip || "unknown-ip";
  },
  validate: { xForwardedForHeader: false, default: true },
});
