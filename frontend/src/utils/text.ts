// Utilitários de texto para nomes de pessoas.

/** Iniciais das duas primeiras palavras do nome (ex.: "Maria Souza Lima" → "MS"). */
export function getInitials(name: string): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Primeiro nome (ex.: "Maria Souza" → "Maria"); vazio se não houver nome. */
export function firstName(name: string | null | undefined): string {
  return name ? name.split(" ")[0] : "";
}
