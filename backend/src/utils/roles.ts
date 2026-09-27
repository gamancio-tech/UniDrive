import { AuthenticatedUser } from "../types/express";

export function hasRole<R extends AuthenticatedUser["role"]>(
  user: AuthenticatedUser,
  role: R
): user is Extract<AuthenticatedUser, { role: R }> {
  return user.role === role;
}
