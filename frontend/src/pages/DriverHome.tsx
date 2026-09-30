import { useState } from "react";
import { apiRequest, authStorage } from "../api/client";
import { useDailyStatus } from "../features/dailyStatus/useDailyStatus";
import { DriverStudentList } from "../features/driver/DriverStudentList";
import { BottomNavigation } from "../components/BottomNavigation";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { useToast } from "../components/Toast";

type DriverTab = "operations" | "students" | "announcements";

export function DriverHome() {
  const { missingCount, cancelled, loading, lastUpdated, cancelTrip, uncancelTrip } = useDailyStatus();
  const { showToast } = useToast();
  const [message, setMessage] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [activeTab, setActiveTab] = useState<DriverTab>("operations");

  async function publishAnnouncement() {
    if (!message.trim()) return;
    setPublishing(true);
    try {
      await apiRequest("/announcements", { method: "POST", body: { message } });
      setMessage("");
      showToast("Aviso publicado para todos os alunos!", "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erro ao publicar aviso.", "error");
    } finally {
      setPublishing(false);
    }
  }

  async function handleCancelTrip() {
    try {
      await cancelTrip();
      showToast("Viagem de hoje cancelada.", "info");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erro ao cancelar viagem.", "error");
    }
  }

  async function handleUncancelTrip() {
    try {
      await uncancelTrip();
      showToast("Cancelamento desfeito com sucesso!", "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erro ao reativar viagem.", "error");
    }
  }

  const handleLogout = () => {
    authStorage.clear();
    window.location.reload();
  };

  return (
    <>
      <main>
        <div className="header-row">
          <div>
            <h1>UniDrive</h1>
            <p className="list-item-sub">Painel do Motorista</p>
          </div>
          <Button variant="ghost" onClick={handleLogout}>
            Sair
          </Button>
        </div>

        {/* Aba: Hoje (Operação) */}
        {activeTab === "operations" && (
          <>
            {loading ? (
              <Card title="Status da Van">
                <p style={{ color: "hsl(var(--text-secondary))", textAlign: "center" }}>
                  Carregando dados da viagem...
                </p>
              </Card>
            ) : cancelled ? (
              <Card
                title="Viagem de Hoje Cancelada"
                subtitle="Os alunos foram notificados"
                action={<Badge variant="danger">Cancelada</Badge>}
              >
                <p style={{ color: "hsl(var(--text-secondary))", lineHeight: 1.5 }}>
                  Você cancelou a viagem de hoje. Se precisar reativar, clique abaixo.
                </p>
                <div style={{ marginTop: "1rem" }}>
                  <Button variant="primary" onClick={handleUncancelTrip}>
                    Desfazer Cancelamento
                  </Button>
                </div>
              </Card>
            ) : (
              <Card
                title="Embarque da Volta"
                subtitle="Contador atualizado automaticamente"
                action={<Badge variant="success">Em Andamento</Badge>}
              >
                <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
                  <div className="stat-number" style={{ fontSize: "4rem" }}>
                    {missingCount ?? 0}
                  </div>
                  <div className="stat-label">
                    {missingCount === 0
                      ? "🎉 Todos os alunos já embarcaram!"
                      : "aluno(s) restante(s) para embarcar"}
                  </div>
                  {lastUpdated && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "0.4rem",
                        fontSize: "0.8rem",
                        color: "hsl(var(--text-secondary))",
                        marginTop: "0.85rem",
                      }}
                    >
                      <span
                        style={{
                          width: "7px",
                          height: "7px",
                          borderRadius: "50%",
                          backgroundColor: "hsl(var(--success))",
                          display: "inline-block",
                          boxShadow: "0 0 6px hsl(var(--success))",
                        }}
                      />
                      <span>
                        Atualizado às{" "}
                        {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • Ao vivo
                      </span>
                    </div>
                  )}
                </div>
                <Button variant="danger" onClick={handleCancelTrip}>
                  Cancelar Viagem de Hoje
                </Button>
              </Card>
            )}
          </>
        )}

        {/* Aba: Alunos */}
        {activeTab === "students" && <DriverStudentList />}

        {/* Aba: Avisos */}
        {activeTab === "announcements" && (
          <Card
            title="Mural de Avisos"
            subtitle="Envie recados e alertas para todos os alunos"
          >
            <div className="announcement-form" style={{ marginTop: 0 }}>
              <textarea
                placeholder="Ex: 'Estou saindo em 5 minutos', 'A van está no bloco B'..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
              <Button
                variant="primary"
                onClick={publishAnnouncement}
                isLoading={publishing}
                disabled={!message.trim()}
              >
                Publicar Aviso
              </Button>
            </div>
          </Card>
        )}
      </main>

      <BottomNavigation
        role="driver"
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as DriverTab)}
      />
    </>
  );
}
