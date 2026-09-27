export type AuthenticatedRole = "driver" | "student" | "admin";

export interface DriveUser {
  id: string;
  role: "driver";
}

export interface StudentUser {
  id: string;
  role: "student";
  driverId: string;
}

export interface AdminUser {
  id: string;
  role: "admin";
}

export type AuthenticatedUser = DriveUser | StudentUser | AdminUser;

export function hasRole<R extends AuthenticatedUser["role"]>(
  user: AuthenticatedUser,
  role: R
): user is Extract<AuthenticatedUser, { role: R }> {
  return user.role === role;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
