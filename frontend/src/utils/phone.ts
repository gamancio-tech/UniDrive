// Utilitários de telefone (formato brasileiro com DDD).

/** Mantém só os dígitos do valor informado. */
export function getPhoneDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/** Máscara de digitação: (11) 99999-9999 (aceita até 11 dígitos). */
export function formatPhoneInput(value: string): string {
  const digits = getPhoneDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits.length > 0 ? `(${digits}` : "";
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

/** Monta o link `tel:` mantendo apenas dígitos e o "+" (código do país). */
export function toTelHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
