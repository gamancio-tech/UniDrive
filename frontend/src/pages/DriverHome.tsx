import { useState } from "react";
import { apiRequest } from "../api/client";
import { useDailyStatus } from "../features/dailyStatus/useDailyStatus";

export function DriverHome() {
  const { missingCount, cancelled, loading } = useDailyStatus();
  const [message, setMessage] = useState("");

  async function publishAnnouncement() {
    if (!message.trim()) return;
    await apiRequest("/announcements", { method: "POST", body: { message } });
    setMessage("");
  }

  async function cancelToday() {
    await apiRequest("/trip-cancellations", { method: "POST", body: { reason: "Cancelado pelo motorista" } });
  }

  return (
    <main>
      <h1>UniDrive — Motorista</h1>

      {loading ? (
        <p>Carregando...</p>
      ) : cancelled ? (
        <p>Você cancelou a viagem de hoje.</p>
      ) : (
        <p>Faltam {missingCount} aluno(s) para embarcar.</p>
      )}

      <button onClick={cancelToday}>Cancelar viagem de hoje</button>

      <div className="announcement-form">
        <textarea
          placeholder="Escreva um aviso para os alunos..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button className="primary" onClick={publishAnnouncement}>
          Publicar aviso
        </button>
      </div>
    </main>
  );
}
