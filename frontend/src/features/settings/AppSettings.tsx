import React, { useState, useEffect } from "react";
import { useTheme } from "../../utils/theme";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Badge } from "../../components/Badge";
import { ToggleSwitch } from "../../components/ToggleSwitch";
import { useToast } from "../../components/Toast";
import { getPushStatus, subscribeToPush, unsubscribeFromPush, sendTestPush, PushStatus } from "../../api/push";
import { logout } from "../../api/client";
import { StudentWeeklyScheduleCard } from "./StudentWeeklyScheduleCard";
import { StudentProfilePhotoCard } from "./StudentProfilePhotoCard";

interface AppSettingsProps {
  role: "driver" | "student" | "admin";
}

export const AppSettings: React.FC<AppSettingsProps> = ({ role }) => {
  const { theme, setTheme } = useTheme();
  const { showToast } = useToast();

  const [pushStatus, setPushStatus] = useState<PushStatus>({
    supported: typeof window !== "undefined" && "Notification" in window,
    permission: typeof Notification !== "undefined" ? Notification.permission : "default",
    isSubscribed: false,
    isIosNonStandalone: false,
  });

  const [activatingPush, setActivatingPush] = useState(false);
  const [testingPush, setTestingPush] = useState(false);

  const checkPush = async () => {
    try {
      const s = await getPushStatus();
      setPushStatus(s);
    } catch {
      // mantém padrão
    }
  };

  useEffect(() => {
    checkPush();
  }, []);

  const handleActivatePush = async () => {
    setActivatingPush(true);
    try {
      const res = await subscribeToPush();
      showToast(res.message, "success");
      await checkPush();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao ativar notificações.";
      showToast(msg, "error");
    } finally {
      setActivatingPush(false);
    }
  };

  const handleDeactivatePush = async () => {
    setActivatingPush(true);
    try {
      const res = await unsubscribeFromPush();
      showToast(res.message, "info");
      await checkPush();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao desativar notificações.";
      showToast(msg, "error");
    } finally {
      setActivatingPush(false);
    }
  };

  const handleTestPush = async () => {
    setTestingPush(true);
    try {
      await sendTestPush();
      showToast("Notificação de teste disparada! Verifique seu aparelho.", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao enviar notificação de teste.";
      showToast(msg, "error");
    } finally {
      setTestingPush(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const isDarkMode = theme === "dark";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Card de Aparência / Tema */}
      <Card
        title="Aparência e Tema"
        subtitle="Alterne entre o tema claro de alta visibilidade e o tema escuro clássico"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "0.25rem" }}>
          {/* Switch rápido */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "0.85rem 1rem",
              background: "var(--bg-page)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--text-main)" }}>
                {isDarkMode ? "🌙 Modo Escuro Ativo" : "☀️ Modo Claro Ativo"}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                {isDarkMode
                  ? "Cores escuras clássicas, ideal para uso noturno"
                  : "Cores claras vibrantes, ideal sob luz solar"}
              </div>
            </div>
            <ToggleSwitch
              checked={isDarkMode}
              onChange={(checked) => setTheme(checked ? "dark" : "light")}
              ariaLabel="Alternar modo escuro"
            />
          </div>

          {/* Seletores Visuais em Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            {/* Opção Modo Claro */}
            <button
              type="button"
              onClick={() => setTheme("light")}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                textAlign: "left",
                padding: "1rem",
                borderRadius: "var(--radius-md)",
                background: "#ffffff",
                border: !isDarkMode ? "2px solid var(--primary)" : "1.5px solid var(--border-subtle)",
                cursor: "pointer",
                boxShadow: !isDarkMode ? "0 4px 14px rgba(11, 99, 206, 0.15)" : "none",
                minHeight: "100px",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                <span style={{ fontSize: "1.5rem" }}>☀️</span>
                {!isDarkMode && <Badge variant="success">Ativo</Badge>}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#0f172a" }}>
                  Modo Claro
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.15rem" }}>
                  Alto contraste e visibilidade
                </div>
              </div>
            </button>

            {/* Opção Modo Escuro */}
            <button
              type="button"
              onClick={() => setTheme("dark")}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-start",
                textAlign: "left",
                padding: "1rem",
                borderRadius: "var(--radius-md)",
                background: "#13141d",
                border: isDarkMode ? "2px solid #3b82f6" : "1.5px solid rgba(255, 255, 255, 0.15)",
                cursor: "pointer",
                boxShadow: isDarkMode ? "0 4px 14px rgba(59, 130, 246, 0.25)" : "none",
                minHeight: "100px",
                justifyContent: "space-between",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                <span style={{ fontSize: "1.5rem" }}>🌙</span>
                {isDarkMode && <Badge variant="info">Ativo</Badge>}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#f8fafc" }}>
                  Modo Escuro
                </div>
                <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.15rem" }}>
                  Tons sóbrios e azuis escuros
                </div>
              </div>
            </button>
          </div>
        </div>
      </Card>

      {/* Perfil e Foto (Exclusivo para Alunos) */}
      {role === "student" && <StudentProfilePhotoCard />}

      {/* Rotina Semanal Padrão (Exclusivo para Alunos) */}
      {role === "student" && <StudentWeeklyScheduleCard />}

      {/* Card de Notificações e Teste (Realoque do Teste de Notificação) */}
      <Card
        title="Notificações Push"
        subtitle="Gerenciamento e teste de recebimento de avisos em tempo real"
        action={
          pushStatus.isSubscribed && pushStatus.permission === "granted" ? (
            <Badge variant="success">Ativas</Badge>
          ) : pushStatus.permission === "denied" ? (
            <Badge variant="danger">Bloqueadas</Badge>
          ) : (
            <Badge variant="neutral">Inativas</Badge>
          )
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "0.25rem" }}>
          {/* Se iOS não instalado */}
          {pushStatus.isIosNonStandalone && (
            <div
              style={{
                background: "var(--primary-light)",
                borderRadius: "var(--radius-sm)",
                padding: "0.85rem 1rem",
                fontSize: "0.85rem",
                color: "var(--text-main)",
                lineHeight: 1.5,
              }}
            >
              📱 <strong>Dica para iPhone (iOS):</strong> Para receber notificações, adicione este app à Tela de Início via menu de compartilhamento do Safari.
            </div>
          )}

          {/* Status e Descrição */}
          <div style={{ fontSize: "0.88rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
            {pushStatus.isSubscribed && pushStatus.permission === "granted" ? (
              <p style={{ margin: 0 }}>
                Seu dispositivo está cadastrado no servidor para receber avisos instantâneos de partida da van, comunicados do motorista e lembretes de presença.
              </p>
            ) : pushStatus.permission === "denied" ? (
              <p style={{ margin: 0, color: "var(--danger)" }}>
                As notificações estão bloqueadas nas configurações do seu navegador. Permita o envio para receber os comunicados da van.
              </p>
            ) : (
              <p style={{ margin: 0 }}>
                As notificações push não estão ativadas neste navegador. Ative para não perder a saída da van!
              </p>
            )}
          </div>

          {/* Botões de Ação de Notificação */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            {/* Se ainda não ativado, botão para ativar */}
            {(!pushStatus.isSubscribed || pushStatus.permission !== "granted") && pushStatus.supported && (
              <Button
                variant="primary"
                onClick={handleActivatePush}
                isLoading={activatingPush}
                disabled={pushStatus.permission === "denied"}
              >
                🔔 Ativar Notificações no Dispositivo
              </Button>
            )}

            {/* Se já ativado, botão para desativar */}
            {pushStatus.isSubscribed && pushStatus.permission === "granted" && pushStatus.supported && (
              <Button
                variant="secondary"
                onClick={handleDeactivatePush}
                isLoading={activatingPush}
                style={{ minHeight: "44px" }}
              >
                🔕 Desativar Notificações Neste Aparelho
              </Button>
            )}

            {/* Botão de Teste Requalificado e Alocado aqui */}
            {pushStatus.supported && (
              <div
                style={{
                  background: "var(--bg-page)",
                  borderRadius: "var(--radius-md)",
                  padding: "1rem",
                  border: "1px solid var(--border-subtle)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.6rem",
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: "0.92rem", color: "var(--text-main)" }}>
                    🧪 Teste de Disparo de Notificação
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: "0.15rem" }}>
                    Envia um alerta de teste em tempo real através do servidor via Web Push API.
                  </div>
                </div>

                <Button
                  variant="secondary"
                  onClick={handleTestPush}
                  isLoading={testingPush}
                  style={{ minHeight: "44px", fontSize: "0.9rem" }}
                >
                  {testingPush ? "Disparando teste..." : "🚀 Disparar Notificação de Teste"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Card da Conta e Informações */}
      <Card
        title="Sobre o UniDrive"
        subtitle={`Perfil de acesso: ${role === "driver" ? "Motorista" : role === "student" ? "Aluno" : "Administrador"}`}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", marginTop: "0.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", color: "var(--text-muted)" }}>
            <span>Versão do App</span>
            <span style={{ fontWeight: 600, color: "var(--text-main)" }}>v0.1.0 (MVP)</span>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.85rem", color: "var(--text-muted)" }}>
            <span>Modo de Operação</span>
            <span style={{ fontWeight: 600, color: "var(--text-main)" }}>PWA / Tempo Real REST</span>
          </div>

          <div style={{ marginTop: "0.5rem" }}>
            <Button variant="danger" onClick={handleLogout} style={{ minHeight: "44px" }}>
              Encerrar Sessão (Sair) ⎋
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
