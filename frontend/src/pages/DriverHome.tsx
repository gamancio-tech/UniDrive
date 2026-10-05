import { useState, useEffect, useCallback, useMemo } from "react";
import { apiRequest, logout } from "../api/client";
import { useDailyStatus } from "../features/dailyStatus/useDailyStatus";
import { DriverStudentList, TripType } from "../features/driver/DriverStudentList";
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
import { resetAllDailyBoarded } from "../api/students";
import { DriverChatConversationList } from "../features/chat/DriverChatConversationList";
import { useUnreadChatCount } from "../features/chat/useUnreadChatCount";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faRightFromBracket,
  faSun,
  faMoon,
  faVanShuttle,
  faRocket,
  faFlagCheckered,
  faRotateLeft,
  faBullhorn,
} from "@fortawesome/free-solid-svg-icons";

type DriverTab = "operations" | "students" | "chat" | "announcements" | "settings";

export function DriverHome() {
  const { showToast } = useToast();
  const { unreadCount: chatUnreadCount } = useUnreadChatCount();
  const [isDriverChatOpen, setIsDriverChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<DriverTab>(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("tab") === "chat") return "chat";
    }
    return "operations";
  });
  const [tripType, setTripType] = useState<TripType>(() => {
    const saved = localStorage.getItem("unidrive_driver_trip_type");
    return saved === "volta" ? "volta" : "ida";
  });

  const {
    missingCount,
    cancelled,
    loading,
    lastUpdated,
    cancelTrip,
    uncancelTrip,
    refresh,
    currentTrip,
    tripStep,
    updateTripState,
  } = useDailyStatus(tripType);

  const [message, setMessage] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [announcementRefreshKey, setAnnouncementRefreshKey] = useState(0);
  const [students, setStudents] = useState<{ id: string; todayStatus?: string }[]>([]);
  const [executingAction, setExecutingAction] = useState(false);

  // Modais de confirmação
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);

  const loadStudents = useCallback(() => {
    apiRequest<{ id: string; todayStatus?: string }[]>("/students")
      .then((data) => setStudents(data))
      .catch((err) => console.error("Erro ao carregar alunos:", err));
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents, tripType]);

  // Sincroniza o seletor com o estado global se o motorista estiver na mesma viagem
  useEffect(() => {
    if (currentTrip && (currentTrip === "ida" || currentTrip === "volta")) {
      const saved = localStorage.getItem("unidrive_driver_trip_type");
      if (!saved) {
        setTripType(currentTrip);
      }
    }
  }, [currentTrip]);

  const handleTripChange = (newTrip: TripType) => {
    setTripType(newTrip);
    localStorage.setItem("unidrive_driver_trip_type", newTrip);
  };

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

  // Executa a transição de estado da viagem dependendo do momento
  async function handleExecuteTripAction() {
    try {
      setExecutingAction(true);

      if (tripType === "ida") {
        // Finaliza a ida e abre a espera para a volta
        await resetAllDailyBoarded();
        await updateTripState("volta", "aguardando");
        handleTripChange("volta");
        setIsActionModalOpen(false);
        await refresh();
        loadStudents();
        showToast("Ida finalizada! Espera da volta aberta para os alunos.", "success");
      } else if (tripType === "volta" && tripStep === "aguardando") {
        // Motorista declara partida da volta -> inicia a viagem e o contador de faltantes SOME para os alunos
        await updateTripState("volta", "em_viagem");
        setIsActionModalOpen(false);
        await refresh();
        loadStudents();
        showToast("Viagem de volta iniciada! A contagem de alunos foi encerrada para os passageiros.", "success");
      } else if (tripType === "volta" && tripStep === "em_viagem") {
        // Motorista encerra a viagem de volta -> reseta para a ida do próximo dia
        await resetAllDailyBoarded();
        await updateTripState("ida", "aguardando");
        handleTripChange("ida");
        setIsActionModalOpen(false);
        await refresh();
        loadStudents();
        showToast("Viagem de volta concluída com sucesso! Embarques resetados para o próximo dia.", "success");
      }
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erro ao atualizar estado da viagem.", "error");
    } finally {
      setExecutingAction(false);
    }
  }

  // Permite reabrir a espera de embarque da volta se o motorista tiver clicado por engano
  async function handleReopenWaiting() {
    try {
      setExecutingAction(true);
      await updateTripState("volta", "aguardando");
      await refresh();
      showToast("Espera de volta reaberta! Os alunos já podem ver a contagem e fazer check-in.", "info");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erro ao reabrir espera.", "error");
    } finally {
      setExecutingAction(false);
    }
  }

  const handleLogout = () => {
    logout();
  };

  // Contagem de alunos previstos especificamente para o trajeto atual
  const tripStudentsCount = useMemo(() => {
    return students.filter((s) => {
      const status = s.todayStatus || "vai_normal";
      if (tripType === "ida") {
        return status === "vai_normal" || status === "so_ida";
      } else {
        return status === "vai_normal" || status === "so_volta";
      }
    }).length;
  }, [students, tripType]);

  const effectiveTotal = Math.max(tripStudentsCount, missingCount ?? 0, 1);
  const completedStudents = Math.max(0, effectiveTotal - (missingCount ?? 0));

  // Determina rótulos dinâmicos para a operação
  const isVoltaAguardando = tripType === "volta" && tripStep === "aguardando";
  const isVoltaEmViagem = tripType === "volta" && tripStep === "em_viagem";

  return (
    <>
      <main className={activeTab === "chat" ? "main-chat-layout" : undefined}>
        {/* Cabeçalho Minimalista com Botão Sair em pílula (ocultado durante o chat para aproveitamento de tela) */}
        {activeTab !== "chat" && (
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
              style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem" }}
            >
              <span>Sair</span>
              <FontAwesomeIcon icon={faRightFromBracket} />
            </button>
          </div>
        )}

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
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap" }}>
                      <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0, color: "var(--text-main)" }}>
                        {tripType === "ida"
                          ? "Embarque da Ida"
                          : isVoltaEmViagem
                          ? "Viagem de Retorno em Andamento"
                          : "Espera para a Volta"}
                      </h2>
                      <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                        ({tripType === "ida" ? "Faculdade" : "Retorno"})
                      </span>
                    </div>
                    <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "0.15rem 0 0" }}>
                      {tripType === "ida"
                        ? "Controle ao vivo da ida para a faculdade"
                        : isVoltaEmViagem
                        ? "Van a caminho das residências • Contador encerrado no app dos alunos"
                        : "Aguardando alunos no campus • Contador ativo no app dos alunos"}
                    </p>
                  </div>
                  <Badge variant={isVoltaEmViagem ? "success" : isVoltaAguardando ? "warning" : "info"}>
                    {isVoltaEmViagem ? (
                      <>
                        <FontAwesomeIcon icon={faVanShuttle} style={{ marginRight: "0.3rem" }} />
                        Em Viagem
                      </>
                    ) : isVoltaAguardando ? (
                      "Aguardando Alunos"
                    ) : (
                      "Em Andamento"
                    )}
                  </Badge>
                </div>

                {/* Seletor rápido de trajeto ativo */}
                <div style={{ display: "flex", gap: "0.45rem", margin: "0.35rem 0 0.85rem" }}>
                  <button
                    type="button"
                    onClick={() => handleTripChange("ida")}
                    className={`filter-pill ${tripType === "ida" ? "active" : ""}`}
                    style={{ minHeight: "30px", padding: "0.18rem 0.75rem", fontSize: "0.78rem" }}
                  >
                    <FontAwesomeIcon icon={faSun} style={{ marginRight: "0.35rem" }} />
                    Ida
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTripChange("volta")}
                    className={`filter-pill ${tripType === "volta" ? "active" : ""}`}
                    style={{ minHeight: "30px", padding: "0.18rem 0.75rem", fontSize: "0.78rem" }}
                  >
                    <FontAwesomeIcon icon={faMoon} style={{ marginRight: "0.35rem" }} />
                    Volta
                  </button>
                </div>

                {/* Gráfico Donut SVG Circular */}
                <DonutProgressChart
                  total={effectiveTotal}
                  completed={completedStudents}
                  label={missingCount === 0 ? "Todos a bordo!" : isVoltaEmViagem ? "Embarque Concluído" : "Faltam embarcar"}
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

                {/* Botão de Ação Principal Integrado à Máquina de Estados da Viagem */}
                <div style={{ marginTop: "1.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {tripType === "ida" ? (
                    <Button
                      variant="primary"
                      className="btn-giant"
                      onClick={() => setIsActionModalOpen(true)}
                      disabled={executingAction}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.45rem" }}
                    >
                      <FontAwesomeIcon icon={faVanShuttle} />
                      <span>{executingAction ? "FINALIZANDO IDA..." : "FINALIZAR IDA E ABRIR ESPERA DA VOLTA"}</span>
                    </Button>
                  ) : isVoltaAguardando ? (
                    <Button
                      variant="primary"
                      className="btn-giant"
                      onClick={() => setIsActionModalOpen(true)}
                      disabled={executingAction}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.45rem" }}
                    >
                      <FontAwesomeIcon icon={faRocket} />
                      <span>{executingAction ? "INICIANDO VIAGEM..." : "DECLARAR PARTIDA (INICIAR VIAGEM DE VOLTA)"}</span>
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="primary"
                        className="btn-giant"
                        onClick={() => setIsActionModalOpen(true)}
                        disabled={executingAction}
                        style={{ background: "var(--success-dark)", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.45rem" }}
                      >
                        <FontAwesomeIcon icon={faFlagCheckered} />
                        <span>{executingAction ? "FINALIZANDO RETORNO..." : "FINALIZAR VIAGEM DE RETORNO"}</span>
                      </Button>
                      <button
                        type="button"
                        onClick={handleReopenWaiting}
                        disabled={executingAction}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--primary)",
                          fontSize: "0.8rem",
                          fontWeight: 600,
                          cursor: "pointer",
                          padding: "0.2rem",
                          textDecoration: "underline",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "0.35rem",
                        }}
                      >
                        <FontAwesomeIcon icon={faRotateLeft} />
                        <span>Reabrir espera de embarque (caso tenha iniciado por engano)</span>
                      </button>
                    </>
                  )}

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

        {/* Aba: Alunos — 3 Listas sincronizadas com o mesmo trajeto */}
        {activeTab === "students" && (
          <DriverStudentList
            tripType={tripType}
            onTripChange={handleTripChange}
            onTripFinished={() => {
              refresh();
              loadStudents();
            }}
          />
        )}

        {/* Aba: Chat — Conversas 1:1 com os alunos */}
        {activeTab === "chat" && (
          <DriverChatConversationList tripType={tripType} onOpenConversation={setIsDriverChatOpen} />
        )}

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
                  style={{ minHeight: "50px", fontSize: "1rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.45rem" }}
                >
                  <FontAwesomeIcon icon={faBullhorn} />
                  <span>Enviar Aviso</span>
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
            Tem certeza de que deseja cancelar a viagem de hoje?
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

      {/* Modal Dinâmico de Ação de Viagem */}
      <Modal
        isOpen={isActionModalOpen}
        onClose={() => !executingAction && setIsActionModalOpen(false)}
        title={
          tripType === "ida"
            ? "Finalizar Viagem de Ida"
            : isVoltaAguardando
            ? "Declarar Partida da Volta"
            : "Finalizar Viagem de Retorno"
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {tripType === "ida" ? (
            <>
              <p style={{ margin: 0, lineHeight: 1.5, color: "var(--text-main)" }}>
                Deseja finalizar a viagem de ida e abrir o embarque da volta?
              </p>
              <div
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  padding: "0.75rem",
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                  lineHeight: 1.5,
                }}
              >
                A lista de embarcados será resetada e o estado da van passará para <strong>espera de volta</strong>. Os alunos verão a contagem de faltantes e poderão fazer check-in de retorno.
              </div>
            </>
          ) : isVoltaAguardando ? (
            <>
              {(missingCount ?? 0) > 0 ? (
                <>
                  <p style={{ margin: 0, lineHeight: 1.5, color: "var(--text-main)" }}>
                    Ainda constam <strong>{missingCount} aluno(s)</strong> sem embarcar na Volta.
                  </p>
                  <div
                    style={{
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-md)",
                      padding: "0.75rem",
                      fontSize: "0.85rem",
                      color: "var(--text-muted)",
                      lineHeight: 1.5,
                    }}
                  >
                    Ao declarar partida, a viagem de volta será iniciada e o <strong>contador de alunos restantes sumirá da tela de todos os alunos</strong>.
                  </div>
                </>
              ) : (
                <>
                  <p style={{ margin: 0, lineHeight: 1.5, color: "var(--text-main)", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                    <span>Todos os alunos previstos para a volta já estão a bordo!</span>
                    <FontAwesomeIcon icon={faVanShuttle} />
                  </p>
                  <div
                    style={{
                      background: "var(--bg-input)",
                      border: "1px solid var(--border-subtle)",
                      borderRadius: "var(--radius-md)",
                      padding: "0.75rem",
                      fontSize: "0.85rem",
                      color: "var(--text-muted)",
                      lineHeight: 1.5,
                    }}
                  >
                    Confirmar a partida mudará o status para <strong>em viagem</strong> e encerrará a contagem de faltantes na tela dos alunos.
                  </div>
                </>
              )}
            </>
          ) : (
            <>
              <p style={{ margin: 0, lineHeight: 1.5, color: "var(--text-main)" }}>
                Deseja concluir a viagem de retorno de hoje?
              </p>
              <div
                style={{
                  background: "var(--bg-input)",
                  border: "1px solid var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  padding: "0.75rem",
                  fontSize: "0.85rem",
                  color: "var(--text-muted)",
                  lineHeight: 1.5,
                }}
              >
                Isso encerrará a operação do dia, resetará todos os embarques e preparará o sistema para a próxima viagem de ida.
              </div>
            </>
          )}

          <div className="button-group" style={{ margin: "0.5rem 0 0" }}>
            <Button
              variant="primary"
              onClick={handleExecuteTripAction}
              isLoading={executingAction}
            >
              {tripType === "ida"
                ? "Finalizar Ida e Abrir Volta"
                : isVoltaAguardando
                ? "Confirmar Partida (Iniciar Viagem)"
                : "Concluir Viagem de Hoje"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsActionModalOpen(false)}
              disabled={executingAction}
            >
              Voltar
            </Button>
          </div>
        </div>
      </Modal>

      <BottomNavigation
        role="driver"
        activeTab={activeTab}
        onTabChange={(tab) => setActiveTab(tab as DriverTab)}
        chatUnreadCount={chatUnreadCount}
      />
    </>
  );
}
