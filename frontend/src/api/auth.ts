import { apiRequest } from "./client";

export async function forgotPassword(email: string) {
  return apiRequest<{ message: string }>("/auth/forgot-password", {
    method: "POST",
    body: { email },
  });
}

export async function resetPassword(token: string, password: string) {
  return apiRequest<{ message: string }>("/auth/reset-password", {
    method: "POST",
    body: { token, password },
  });
}
