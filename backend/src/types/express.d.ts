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
  isSuperAdmin?: boolean;
}

export type AuthenticatedUser = DriveUser | StudentUser | AdminUser;


declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
