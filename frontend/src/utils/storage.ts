// Acesso centralizado ao localStorage: chaves em um só lugar e leitura/escrita
// protegidas com try/catch (o storage pode estar indisponível, ex.: modo privado).

export const STORAGE_KEYS = {
  driverTripType: "unidrive_driver_trip_type",
  activeClassId: "unidrive_active_class_id",
  activeClassName: "unidrive_active_class_name",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export function getStorage(key: StorageKey): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function setStorage(key: StorageKey, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Ignora: a preferência só deixa de ser persistida.
  }
}

export function removeStorage(key: StorageKey): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignora: a preferência só deixa de ser removida.
  }
}
