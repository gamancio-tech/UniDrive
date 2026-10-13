import { prisma } from "../src/lib/prisma";

async function cleanDatabaseExceptAdmins() {
  console.log("🔍 Verificando registros no banco de dados...\n");

  const [
    adminCount,
    driverCount,
    classCount,
    studentCount,
    chatCount,
    dailyStatusCount,
    scheduleCount,
    paymentCycleCount,
    cancellationCount,
    announcementCount,
    pushSubNonAdminCount,
    passwordResetCount,
  ] = await Promise.all([
    prisma.admin.count(),
    prisma.driver.count(),
    prisma.class.count(),
    prisma.student.count(),
    prisma.chatMessage.count(),
    prisma.dailyStatus.count(),
    prisma.studentWeeklySchedule.count(),
    prisma.paymentCycle.count(),
    prisma.tripCancellation.count(),
    prisma.announcement.count(),
    prisma.pushSubscription.count({ where: { adminId: null } }),
    prisma.passwordReset.count(),
  ]);

  console.log("📊 Registros encontrados:");
  console.log(`- Administradores (serão MANTIDOS): ${adminCount}`);
  console.log(`- Motoristas: ${driverCount}`);
  console.log(`- Alunos: ${studentCount}`);
  console.log(`- Turmas: ${classCount}`);
  console.log(`- Mensagens de chat: ${chatCount}`);
  console.log(`- Status diários: ${dailyStatusCount}`);
  console.log(`- Rotinas semanais: ${scheduleCount}`);
  console.log(`- Ciclos de pagamento: ${paymentCycleCount}`);
  console.log(`- Cancelamentos de viagem: ${cancellationCount}`);
  console.log(`- Avisos do mural: ${announcementCount}`);
  console.log(`- Push subscriptions (não-admin): ${pushSubNonAdminCount}`);
  console.log(`- Tokens de reset de senha: ${passwordResetCount}\n`);

  if (adminCount === 0) {
    console.warn("⚠️ AVISO: Nenhum administrador encontrado na tabela Admin!");
  } else {
    const admins = await prisma.admin.findMany({
      select: { id: true, name: true, email: true, isSuperAdmin: true },
    });
    console.log("👤 Administradores que serão preservados:");
    admins.forEach((a) => {
      console.log(`   - [${a.isSuperAdmin ? "Super Admin" : "Admin"}] ${a.name} (${a.email})`);
    });
    console.log("");
  }

  console.log("🧹 Iniciando limpeza dos dados de teste...");

  const result = await prisma.$transaction(async (tx) => {
    // 1. Dependentes de Alunos e Motoristas
    const deletedChat = await tx.chatMessage.deleteMany({});
    const deletedDailyStatus = await tx.dailyStatus.deleteMany({});
    const deletedSchedules = await tx.studentWeeklySchedule.deleteMany({});
    const deletedPaymentCycles = await tx.paymentCycle.deleteMany({});
    const deletedCancellations = await tx.tripCancellation.deleteMany({});
    const deletedAnnouncements = await tx.announcement.deleteMany({});

    // 2. Inscrições Push de motoristas e alunos (mantém push subscriptions com adminId)
    const deletedPushSubs = await tx.pushSubscription.deleteMany({
      where: { adminId: null },
    });

    // 3. Tokens de redefinição de senha de testes
    const deletedPasswordResets = await tx.passwordReset.deleteMany({});

    // 4. Alunos
    const deletedStudents = await tx.student.deleteMany({});

    // 5. Turmas
    const deletedClasses = await tx.class.deleteMany({});

    // 6. Motoristas
    const deletedDrivers = await tx.driver.deleteMany({});

    return {
      chatMessages: deletedChat.count,
      dailyStatuses: deletedDailyStatus.count,
      weeklySchedules: deletedSchedules.count,
      paymentCycles: deletedPaymentCycles.count,
      tripCancellations: deletedCancellations.count,
      announcements: deletedAnnouncements.count,
      pushSubscriptions: deletedPushSubs.count,
      passwordResets: deletedPasswordResets.count,
      students: deletedStudents.count,
      classes: deletedClasses.count,
      drivers: deletedDrivers.count,
    };
  });

  console.log("✅ Limpeza concluída com sucesso no banco de dados!");
  console.log("Registros excluídos:");
  console.table(result);

  const remainingAdmins = await prisma.admin.findMany({
    select: { id: true, name: true, email: true },
  });
  console.log(`\n🔒 Total de Administradores preservados: ${remainingAdmins.length}`);
}

cleanDatabaseExceptAdmins()
  .catch((err) => {
    console.error("❌ Erro ao limpar o banco de dados:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
