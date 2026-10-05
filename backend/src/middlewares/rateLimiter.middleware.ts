import rateLimit from "express-rate-limit";
import { Request } from "express";

export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 500, // limite de 500 requisições por janela
  message: { error: "Muitas requisições efetuadas. Aguarde um instante." },
  keyGenerator: (req: Request) => {
    // Se logado (via req.user inserido pelo middleware de autenticação), usa o ID. 
    // Se não, usa o IP da rede.
    if (req.user && req.user.id) {
      return req.user.id;
    }
    return req.ip || "unknown-ip";
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 15, // 15 tentativas
  message: { error: "Muitas tentativas de acesso. Tente novamente após 15 minutos." },
  keyGenerator: (req: Request) => {
    // Para autenticação, combina o IP e o e-mail tentado para evitar brute-force
    // cruzado (um IP tentando várias contas ou vários IPs tentando uma conta).
    const email = req.body?.email || "unknown-email";
    const ip = req.ip || "unknown-ip";
    return `${ip}_${email}`;
  },
});
