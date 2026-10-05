import cors from "cors";
import express from "express";
import compression from "compression";
import { env } from "./config/env";
import { errorHandlerMiddleware } from "./middlewares/errorHandler.middleware";
import { routes } from "./routes";

export function createApp() {
  const app = express();

  const corsOrigin = env.frontendUrls.includes("*") ? "*" : env.frontendUrls;
  app.use(cors({ origin: corsOrigin }));
  app.use(compression());
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use("/api", routes);

  app.use(errorHandlerMiddleware);

  return app;
}
