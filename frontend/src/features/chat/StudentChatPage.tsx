import { useState, useEffect } from "react";
import { getStudentProfile, StudentProfile } from "../../api/students";
import { ChatWindow } from "./ChatWindow";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTriangleExclamation } from "@fortawesome/free-solid-svg-icons";

interface StudentChatPageProps {
  onBack?: () => void;
  tripTitle?: string;
}

export function StudentChatPage({ onBack, tripTitle }: StudentChatPageProps) {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getStudentProfile()
      .then((data) => setProfile(data))
      .catch((err) => console.error("[StudentChat] Erro ao carregar perfil do aluno:", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "3rem 1rem", color: "var(--text-muted)" }}>
        Carregando informações do motorista...
      </div>
    );
  }

  if (!profile || !profile.driverId) {
    return (
      <div
        style={{
          textAlign: "center",
          padding: "2.5rem 1rem",
          background: "var(--bg-card)",
          borderRadius: "var(--radius-md)",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <FontAwesomeIcon
          icon={faTriangleExclamation}
          style={{ fontSize: "2rem", display: "block", margin: "0 auto 0.5rem", color: "var(--warning, #f59e0b)" }}
        />
        <p style={{ fontWeight: 600, margin: 0, color: "var(--text-main)" }}>
          Motorista não encontrado
        </p>
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", margin: "0.25rem 0 0" }}>
          Sua conta ainda não está vinculada a um motorista.
        </p>
      </div>
    );
  }

  const computedTripTitle = tripTitle || "Viagem da Van";

  return (
    <div className="student-chat-wrapper">
      <ChatWindow
        partnerId={profile.driverId}
        partnerName={profile.driverName || "Motorista da Van"}
        partnerPhotoUrl={profile.driverPhotoUrl}
        partnerRole="driver"
        partnerPhone={profile.driverPhone}
        tripTitle={computedTripTitle}
        onBack={onBack}
        hideBackOnDesktop={false}
      />
    </div>
  );
}
