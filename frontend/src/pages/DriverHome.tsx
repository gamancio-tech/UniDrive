import { useState } from "react";
import { apiRequest, authStorage } from "../api/client";
import { useDailyStatus } from "../features/dailyStatus/useDailyStatus";

export function DriverHome() {
  const { missingCount, cancelled, loading, cancelTrip, uncancelTrip } = useDailyStatus();
  const [message, setMessage] = useState("");

  async function publishAnnouncement() {
    if (!message.trim()) return;
    await apiRequest("/announcements", { method: "POST", body: { message } });
    setMessage("");
  }

  return (
    <main>
      <h1>UniDrive — Motorista</h1>

      {loading ? (
        <p>Carregando...</p>
      ) : cancelled ? (
        <div className="card">
          <h2>Viagem cancelada</h2>
          <p>Você cancelou a viagem de hoje.</p>
          <button className="primary" onClick={() => uncancelTrip()}>
            Desfazer cancelamento da viagem
          </button>
        </div>
      ) : (
        <div className="card">
          <h2>Faltam {missingCount} aluno(s) para embarcar</h2>
          <button onClick={() => cancelTrip()}>Cancelar viagem de hoje</button>
        </div>
      )}

      <div className="announcement-form">
        <textarea
          placeholder="Escreva um aviso para os alunos..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button className="primary" onClick={publishAnnouncement}>
          Publicar aviso
        </button>
        <button onClick={() => { authStorage.clear(); window.location.reload(); }}>Logout</button>
      </div>
    </main>
  );
}
