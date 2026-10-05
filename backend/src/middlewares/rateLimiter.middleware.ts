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
});

// Limita tentativas brutas por endereço IP (anti-spray)
const authIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: "Muitas tentativas a partir deste IP. Tente novamente após 15 minutos." },
  keyGenerator: (req: Request) => req.ip || "unknown-ip",
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
});

export const authLimiter = [authIpLimiter, authEmailLimiter];
