import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { Pool, neonConfig } from "@neondatabase/serverless";
import ws from "ws";
import { env } from "../config/env";

// Configura o Neon para usar WebSockets no Node.js através da porta 443 (HTTPS),
// contornando firewalls que bloqueiam a porta padrão 5432 (ex: redes universitárias).
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: env.databaseUrl });
const adapter = new PrismaNeon(pool);

export const prisma = new PrismaClient({ adapter });
