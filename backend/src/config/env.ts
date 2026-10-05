import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return value;
}

const jwtSecret = required("JWT_SECRET");
if (process.env.NODE_ENV === "production" && jwtSecret.length < 32) {
  throw new Error("JWT_SECRET deve ter no mínimo 32 caracteres em ambiente de produção.");
}

export const env = {
  port: Number(process.env.PORT ?? 3333),
  databaseUrl: required("DATABASE_URL"),
  jwtSecret,
  frontendUrls: (process.env.FRONTEND_URL ?? "http://localhost:5173")
    .split(",")
    .map((url) => url.trim().replace(/\/$/, "")),
  vapid: {
    publicKey: process.env.VAPID_PUBLIC_KEY ?? "",
    privateKey: process.env.VAPID_PRIVATE_KEY ?? "",
    contactEmail: process.env.VAPID_CONTACT_EMAIL ?? "mailto:example@example.com",
  },
  // Quando restam este número (ou menos) de alunos para embarcar, dispara notificação (RF03).
  missingCountNotificationThreshold: 2,
  reminderDaysBeforePayment: Number(process.env.REMINDER_DAYS_BEFORE_PAYMENT ?? 3),
};
