import { PrismaClient } from "@prisma/client";

// Instância única reutilizada em toda a aplicação, evitando abrir uma
// conexão nova a cada requisição (comum em ambientes com hot-reload).
export const prisma = new PrismaClient();
