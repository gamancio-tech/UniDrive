import { useEffect, useState } from "react";
import { getPushStatus, subscribeToPush, sendTestPush, PushStatus } from "../api/push";
import { Button } from "./Button";
import { Badge } from "./Badge";
import { Card } from "./Card";
import { useToast } from "./Toast";

export function NotificationBanner() {
  const { showToast } = useToast();
  const [status, setStatus] = useState<PushStatus>({
    supported: typeof window !== "undefined" && "Notification" in window,
    permission: typeof Notification !== "undefined" ? Notification.permission : "default",
    isSubscribed: false,
    isIosNonStandalone: false,
  });
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);

  const checkStatus = async () => {
    try {
      const s = await getPushStatus();
      setStatus(s);
    } catch {
      // mantém o estado padrão
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleActivate = async () => {
    setLoading(true);
    try {
      const res = await subscribeToPush();
      showToast(res.message, "success");
      await checkStatus();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao ativar notificações.";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      await sendTestPush();
      showToast("Notificação de teste enviada! Verifique se chegou no seu aparelho.", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao enviar notificação de teste.";
      showToast(msg, "error");
    } finally {
      setTesting(false);
    }
  };

  // Se for iOS e não estiver no modo PWA instalado
  if (status.isIosNonStandalone) {
    return (
      <Card
        title="📱 Notificações no iPhone"
        subtitle="Para receber avisos da van em tempo real no iOS:"
        className="notification-banner"
      >
        <div style={{ fontSize: "0.9rem", color: "var(--text-muted)", lineHeight: 1.5 }}>
          <p>1. No Safari, toque no ícone de <strong>Compartilhar</strong> (quadrado com seta para cima).</p>
          <p style={{ marginTop: "0.35rem" }}>2. Escolha <strong>Adicionar à Tela de Início</strong>.</p>
          <p style={{ marginTop: "0.35rem" }}>3. Abra o UniDrive pelo ícone na tela inicial para ativar as notificações.</p>
        </div>
      </Card>
    );
  }

  // Se o navegador não suportar Push
  if (!status.supported) {
    return (
      <Card
        title="🔔 Notificações"
        subtitle="Este navegador ou ambiente não suporta Web Push (requer HTTPS ou localhost)."
        action={<Badge variant="neutral">Indisponível</Badge>}
        className="notification-banner"
      />
    );
  }

  // Se já estiver ativado, não ocupa espaço na tela principal (o teste fica em Configurações)
  if (status.isSubscribed && status.permission === "granted") {
    return null;
  }

  // Se a permissão estiver negada
  if (status.permission === "denied") {
    return (
      <Card
        title="⚠️ Notificações Bloqueadas"
        subtitle="As notificações estão bloqueadas nas configurações do seu navegador."
        action={<Badge variant="danger">Bloqueado</Badge>}
        className="notification-banner"
      >
        <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginTop: "0.35rem" }}>
          Para receber avisos quando a van estiver saindo, permita as notificações nas permissões do site no seu navegador.
        </p>
      </Card>
    );
  }

  // Caso padrão: Suportado, aguardando clique de ativação
  return (
    <Card
      title="🔔 Ativar Notificações"
      subtitle="Receba avisos e alertas da van em tempo real diretamente neste dispositivo."
      action={<Badge variant="neutral">Pendente</Badge>}
      className="notification-banner"
    >
      <div style={{ marginTop: "0.75rem" }}>
        <Button
          variant="primary"
          onClick={handleActivate}
          disabled={loading}
        >
          {loading ? "Ativando..." : "🔔 Permitir e Ativar Notificações"}
        </Button>
      </div>
    </Card>
  );
}
