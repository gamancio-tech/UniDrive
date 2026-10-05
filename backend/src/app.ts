import cors from "cors";
import express from "express";
import compression from "compression";
import helmet from "helmet";
import { env } from "./config/env";
import { errorHandlerMiddleware } from "./middlewares/errorHandler.middleware";
import { routes } from "./routes";
import { globalLimiter } from "./middlewares/rateLimiter.middleware";

export function createApp() {
  const app = express();

  // Confia no cabeçalho X-Forwarded-For fornecido pelo proxy (HostGator/Render)
  // Essencial para o rate limiter capturar o IP real do usuário.
  app.set("trust proxy", 1);

  app.use(helmet());

  const isProd = process.env.NODE_ENV === "production";
  const corsOrigin = (!isProd && env.frontendUrls.includes("*")) ? "*" : env.frontendUrls;
  app.use(cors({ origin: corsOrigin }));
  app.use(compression());
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req, res) => res.json({ ok: true }));
  
  // Limiter global para todas as rotas de API
  app.use("/api", globalLimiter);
  app.use("/api", routes);

  app.use(errorHandlerMiddleware);

  return app;
}
