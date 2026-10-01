import { useState, useEffect } from "react";
import { apiRequest, logout } from "../api/client";
import { useDailyStatus } from "../features/dailyStatus/useDailyStatus";
import { DriverStudentList } from "../features/driver/DriverStudentList";
import { BottomNavigation } from "../components/BottomNavigation";
import { Card } from "../components/Card";
import { Button } from "../components/Button";
import { Badge } from "../components/Badge";
import { Modal } from "../components/Modal";
import { useToast } from "../components/Toast";
import { NotificationBanner } from "../components/NotificationBanner";
import { DonutProgressChart } from "../components/DonutProgressChart";
import { QuickMessageChips } from "../components/QuickMessageChips";
import { AnnouncementList } from "../features/announcements/AnnouncementList";
import { publishAnnouncement as apiPublishAnnouncement } from "../api/announcements";
import { AppSettings } from "../features/settings/AppSettings";

type DriverTab = "operations" | "students" | "announcements" | "settings";

export function DriverHome() {
  const { missingCount, cancelled, loading, lastUpdated, cancelTrip, uncancelTrip } = useDailyStatus();
  const { showToast } = useToast();
  const [message, setMessage] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [activeTab, setActiveTab] = useState<DriverTab>("operations");
  const [announcementRefreshKey, setAnnouncementRefreshKey] = useState(0);
  const [totalStudents, setTotalStudents] = useState<number>(0);

  // Modais de confirmação
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isDepartModalOpen, setIsDepartModalOpen] = useState(false);

  // Carrega total de alunos cadastrados para compor o Donut
  useEffect(() => {
    apiRequest<{ id: string }[]>("/students")
      .then((students) => setTotalStudents(students.length))
      .catch((err) => console.error("Erro ao carregar contagem de alunos:", err));
  }, []);

  async function publishAnnouncement() {
    if (!message.trim()) return;
    setPublishing(true);
    try {
      await apiPublishAnnouncement(message);
      setMessage("");
      setAnnouncementRefreshKey((prev) => prev + 1);
      showToast("Aviso publicado para todos os alunos!", "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erro ao publicar aviso.", "error");
    } finally {
      setPublishing(false);
    }
  }

  async function handleConfirmCancelTrip() {
    try {
      await cancelTrip();
      setIsCancelModalOpen(false);
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

  function handleDeclareDeparture() {
    if ((missingCount ?? 0) > 0) {
      setIsDepartModalOpen(true);
    } else {
      showToast("Partida confirmada! Tenha uma excelente viagem! 🚐💨", "success");
    }
  }

  const handleLogout = () => {
    logout();
  };

  const effectiveTotal = Math.max(totalStudents, missingCount ?? 0, 1);
  const completedStudents = Math.max(0, effectiveTotal - (missingCount ?? 0));

  return (
    <>
      <main>
        {/* Cabeçalho Minimalista com Botão Sair em pílula */}
        <div className="header-row">
          <div className="brand-header">
            <img src="/icons/icon.png" alt="UniDrive" className="brand-logo" />
            <div>
              <h1>UniDrive</h1>
              <p className="list-item-sub">Painel do Motorista</p>
            </div>
          </div>
          <button
            type="button"
            className="btn-logout-pill"
            onClick={handleLogout}
            title="Sair do sistema"
          >
            Sair ⎋
          </button>
        </div>

        {/* Aba: Hoje (Operação) — Mockup tela1_motorista.jfif */}
        {activeTab === "operations" && (
          <>
            <NotificationBanner />

            {loading ? (
              <Card title="Status da Van">
                <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "1.5rem 0" }}>
                  Carregando dados da viagem...
                </p>
              </Card>
            ) : cancelled ? (
              <Card
                title="Viagem de Hoje Cancelada"
                subtitle="Todos os alunos foram notificados via aplicativo"
                action={<Badge variant="danger">Cancelada</Badge>}
              >
                <p style={{ color: "var(--text-muted)", lineHeight: 1.5, margin: "0.5rem 0 1.25rem" }}>
                  Você cancelou a operação da van no dia de hoje. Se precisar retomar o serviço, clique no botão abaixo.
                </p>
                <Button variant="primary" onClick={handleUncancelTrip}>
                  Desfazer Cancelamento
                </Button>
              </Card>
            ) : (
              <Card>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <div>
                    <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0, color: "var(--text-main)" }}>
                      Embarque da Volta
                    </h2>
                    <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "0.15rem 0 0" }}>
                      Controle ao vivo do retorno
                    </p>
                  </div>
                  <Badge variant="success">Em Andamento</Badge>
                </div>

                {/* Gráfico Donut SVG Circular */}
                <DonutProgressChart
                  total={effectiveTotal}
                  completed={completedStudents}
                  label={missingCount === 0 ? "Todos a bordo!" : "Faltam embarcar"}
                  sublabel={
                    lastUpdated ? (
                      <span className="live-indicator">
                        <span className="live-dot" />
                        <span>
                          Ao vivo • Atualizado às{" "}
                          {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </span>
                    ) : undefined
                  }
                />

                {/* Botão Gigante de Partida e Cancelamento */}
                <div style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <Button
                    variant="primary"
                    className="btn-giant"
                    onClick={handleDeclareDeparture}
                  >
                    🚐 DECLARAR PARTIDA
                  </Button>

                  <button
                    type="button"
                    onClick={() => setIsCancelModalOpen(true)}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--danger)",
                      fontSize: "0.85rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: "0.4rem",
                      minHeight: "auto",
                      textDecoration: "underline",
                      textUnderlineOffset: "3px",
                    }}
                  >
                    Cancelar Viagem de Hoje
                  </button>
                </div>
              </Card>
            )}
          </>
        )}

        {/* Aba: Alunos — Mockup tela2_motorista.jfif */}
        {activeTab === "students" && <DriverStudentList />}

        {/* Aba: Avisos — Mockup tela3_motorista.jfif */}
        {activeTab === "announcements" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <NotificationBanner />

            <Card
              title="Enviar Nova Mensagem"
              subtitle="Envie alertas instantâneos para todos os passageiros"
            >
              <div className="announcement-form" style={{ marginTop: "0.5rem" }}>
                <textarea
                  placeholder="Escreva seu comunicado aqui..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  style={{ minHeight: "95px" }}
                />

                {/* Chips de mensagens rápidas clicáveis */}
                <QuickMessageChips
                  onSelectMessage={(chipText) => {
                    setMessage((prev) => (prev ? `${prev} ${chipText}` : chipText));
                  }}
                />

                <Button
                  variant="primary"
                  onClick={publishAnnouncement}
                  isLoading={publishing}
                  disabled={!message.trim()}
                  style={{ minHeight: "50px", fontSize: "1rem" }}
                >
                  📢 Enviar Aviso
                </Button>
              </div>
            </Card>

            <AnnouncementList
              refreshTrigger={announcementRefreshKey}
              title="Histórico de Avisos Enviados"
              subtitle="Todos os comunicados disparados para os passageiros"
            />
          </div>
        )}

        {/* Aba: Configurações */}
        {activeTab === "settings" && <AppSettings role="driver" />}
      </main>

      {/* Modal de Confirmação de Cancelamento de Viagem */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Cancelar Viagem de Hoje"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <p style={{ margin: 0, lineHeight: 1.5, color: "var(--text-main)" }}>
            Tem certeza de que deseja cancelar a viagem de volta de hoje?
          </p>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.85rem" }}>
            Todos os alunos serão avisados imediatamente por notificação push no celular.
          </p>
          <div className="button-group" style={{ margin: "0.5rem 0 0" }}>
            <Button variant="danger" onClick={handleConfirmCancelTrip}>
              Sim, Cancelar Viagem
            </Button>
            <Button variant="ghost" onClick={() => setIsCancelModalOpen(false)}>
              Voltar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Confirmação de Partida com Alunos Pendentes */}
      <Modal
        isOpen={isDepartModalOpen}
        onClose={() => setIsDepartModalOpen(false)}
        title="Alunos Ainda Pendentes"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <p style={{ margin: 0, lineHeight: 1.5, color: "var(--text-main)" }}>
            Ainda constam <strong>{missingCount} aluno(s)</strong> sem embarcar. Deseja mesmo declarar a partida da van agora?
          </p>
          <div className="button-group" style={{ margin: "0.5rem 0 0" }}>
            <Button
              variant="primary"
              onClick={() => {
                setIsDepartModalOpen(false);
                showToast("Partida confirmada! Tenha uma excelente viagem! 🚐💨", "success");
              }}
            >
              Confirmar Partida Mesmo Assim
            </Button>
            <Button variant="ghost" onClick={() => setIsDepartModalOpen(false)}>
              Aguardar Mais um Pouco
            </Button>
          </div>
        </div>
      </Modal>

      <BottomNavigation
        role="driver"
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as DriverTab)}
      />
    </>
  );
}
