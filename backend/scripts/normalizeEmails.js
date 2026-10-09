const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Normalizando emails para minúsculo...');
  const models = ['admin', 'driver', 'student'];
  for (const model of models) {
    const users = await prisma[model].findMany();
    let count = 0;
    for (const u of users) {
      const lower = u.email.toLowerCase();
      if (u.email !== lower) {
        await prisma[model].update({ where: { id: u.id }, data: { email: lower } });
        count++;
      }
    }
    console.log(model + ': ' + count + ' emails atualizados.');
  }
}

main()
  .catch(e => console.error(e))
  .finally(() => process.exit(0));
