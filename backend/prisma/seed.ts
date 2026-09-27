import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const SALT_ROUNDS = 12;

async function main() {
  const adminEmail = process.env.SEED_ADMIN_EMAIL;
  const adminPassword = process.env.SEED_ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error(
      "Defina SEED_ADMIN_EMAIL e SEED_ADMIN_PASSWORD no seu .env antes de rodar o seed"
    );
  }

  const passwordHash = await bcrypt.hash(adminPassword, SALT_ROUNDS);

  // upsert: se já existir um admin com esse email, não duplica nem quebra
  const admin = await prisma.admin.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      name: "Super Admin",
      email: adminEmail,
      passwordHash,
    },
  });

  console.log(`Admin criado/verificado: ${admin.email} (id: ${admin.id})`);
}

main()
  .catch((e) => {
    console.error(`Erro ao rodar o seed: ${e}`);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });