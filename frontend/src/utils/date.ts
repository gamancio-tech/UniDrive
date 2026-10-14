// Formatação de datas/horas de mensagens do chat.

/** Hora da mensagem (ex.: 14:05). */
export function formatMessageTime(dateIso: string): string {
  try {
    const date = new Date(dateIso);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

/** Rótulo do separador de data: "Hoje", "Ontem" ou dd/mm. */
export function formatMessageDate(dateIso: string): string {
  try {
    const date = new Date(dateIso);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return "Hoje";

    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return "Ontem";

    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  } catch {
    return "";
  }
}
