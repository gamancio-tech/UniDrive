export type AuthenticatedRole = "driver" | "student";

export interface AuthenticatedUser {
  id: string;
  role: AuthenticatedRole;
  driverId: string; // para aluno: o motorista ao qual pertence; para motorista: o próprio id
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
