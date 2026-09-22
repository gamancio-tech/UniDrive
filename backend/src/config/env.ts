import "dotenv/config";

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(`Variável de ambiente obrigatória ausente: ${name}`);
  }
  return value;
}

export const env = {
  port: Number(process.env.PORT ?? 3333),
  databaseUrl: required("DATABASE_URL"),
  jwtSecret: required("JWT_SECRET"),
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
};
