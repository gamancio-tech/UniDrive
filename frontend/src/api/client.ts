const API_URL = import.meta.env.VITE_API_URL ?? "";

const TOKEN_KEY = "van-app:token";

export const authStorage = {
  getToken: () => localStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => localStorage.setItem(TOKEN_KEY, token),
  clear: () => localStorage.removeItem(TOKEN_KEY),
};

export interface DecodedTokenPayload {
  id?: string;
  role?: "driver" | "student" | "admin";
  driverId?: string;
  isSuperAdmin?: boolean;
  [key: string]: unknown;
}

export function getDecodedToken(): DecodedTokenPayload | null {
  const token = authStorage.getToken();
  if (!token) return null;

  try {
    const payloadBase64 = token.split(".")[1];
    return JSON.parse(atob(payloadBase64)) as DecodedTokenPayload;
  } catch {
    return null;
  }
}

export function isSuperAdminUser(): boolean {
  const payload = getDecodedToken();
  return payload?.role === "admin" && Boolean(payload?.isSuperAdmin);
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
}

/** Wrapper simples de fetch: monta a URL, injeta o token e padroniza erros. */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const token = authStorage.getToken();

  const response = await fetch(`${API_URL}/api${path}`, {
    method: options.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ error: "Erro desconhecido." }));
    throw new Error(errorBody.error ?? `Erro na requisição (${response.status})`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
