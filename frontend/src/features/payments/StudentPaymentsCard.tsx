import React, { useState, useEffect, useCallback } from "react";
import {
  PaymentCycle,
  getMyCurrentCycle,
  getMyPaymentHistory,
  payMyCycle,
  updateReminderDays,
} from "../../api/payments";
import { Card } from "../../components/Card";
import { Badge } from "../../components/Badge";
import { Button } from "../../components/Button";
import { useToast } from "../../components/Toast";

export const StudentPaymentsCard: React.FC = () => {
  const { showToast } = useToast();
  const [currentCycle, setCurrentCycle] = useState<PaymentCycle | null>(null);
  const [history, setHistory] = useState<PaymentCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingPaid, setMarkingPaid] = useState(false);
  const [reminderDays, setReminderDays] = useState<number>(3);
  const [savingReminder, setSavingReminder] = useState(false);
  const [copiedPix, setCopiedPix] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [current, hist] = await Promise.all([
        getMyCurrentCycle(),
        getMyPaymentHistory(),
      ]);
      setCurrentCycle(current);
      setReminderDays(current.reminderDaysBefore);
      setHistory(hist);
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erro ao carregar dados de pagamento.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleNotifyPayment = async () => {
    try {
      setMarkingPaid(true);
      const updated = await payMyCycle();
      setCurrentCycle(updated);
      setHistory((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      showToast("Pagamento informado! O motorista irá conferir e confirmar a baixa.", "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erro ao registrar aviso de pagamento.", "error");
    } finally {
      setMarkingPaid(false);
    }
  };

  const handleUpdateReminder = async (newDays: number) => {
    try {
      setSavingReminder(true);
      const updated = await updateReminderDays(newDays);
      setReminderDays(updated.reminderDaysBefore);
      setCurrentCycle(updated);
      showToast(`Lembrete atualizado para ${newDays} dia(s) antes!`, "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erro ao atualizar lembrete.", "error");
    } finally {
      setSavingReminder(false);
    }
  };

  const handleCopyPix = (pixText: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(pixText);
      setCopiedPix(true);
      showToast("Chave Pix copiada para a área de transferência!", "success");
      setTimeout(() => setCopiedPix(false), 3000);
    }
  };

  const formatMonth = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("pt-BR", { month: "long", year: "numeric", timeZone: "UTC" });
    } catch {
      return dateStr;
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
    } catch {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <Card title="Pagamentos" subtitle="Carregando ciclo financeiro...">
        <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "1.5rem 0" }}>
          Buscando mensalidades...
        </p>
      </Card>
    );
  }

  const isCurrentPaid = Boolean(currentCycle?.paidAt);
  const isAwaitingConfirmation = !isCurrentPaid && Boolean(currentCycle?.paymentRequestedAt);
  const previousHistory = history.filter((h) => h.id !== currentCycle?.id);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Card da Mensalidade Atual */}
      <Card
        title="Mensalidade Atual"
        subtitle={currentCycle ? formatMonth(currentCycle.referenceMonth) : "Mês em curso"}
        action={
          isCurrentPaid ? (
            <Badge variant="success">Pago</Badge>
          ) : isAwaitingConfirmation ? (
            <Badge variant="warning">Aguardando Confirmação</Badge>
          ) : (
            <Badge variant="danger">Pendente</Badge>
          )
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "0.25rem" }}>
          {isCurrentPaid ? (
            <div
              style={{
                background: "var(--success-light)",
                border: "1px solid rgba(34, 197, 94, 0.3)",
                borderRadius: "var(--radius-md)",
                padding: "1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.3rem",
              }}
            >
              <div style={{ fontWeight: 700, color: "var(--success-dark)", fontSize: "0.95rem" }}>
                ✓ Mensalidade quitada
              </div>
              <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Pagamento registrado em {currentCycle?.paidAt ? formatDate(currentCycle.paidAt) : "data recente"}
                {" (baixa confirmada pelo motorista)"}
              </div>
            </div>
          ) : isAwaitingConfirmation ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div
                style={{
                  background: "var(--accent-gold-light, rgba(245, 158, 11, 0.1))",
                  border: "1px solid rgba(245, 158, 11, 0.35)",
                  borderRadius: "var(--radius-md)",
                  padding: "1rem",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.4rem",
                }}
              >
                <div style={{ fontWeight: 700, color: "var(--accent-gold-dark, #b45309)", fontSize: "0.95rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span>⏳</span> Aguardando Confirmação do Motorista
                </div>
                <div style={{ fontSize: "0.86rem", color: "var(--text-main)", lineHeight: 1.5 }}>
                  Você informou que realizou o pagamento
                  {currentCycle?.paymentRequestedAt ? ` em ${formatDate(currentCycle.paymentRequestedAt)}` : ""}.
                  O motorista irá conferir o recebimento para confirmar a baixa no sistema.
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                  Assim que for confirmado pelo motorista, o status mudará automaticamente para <strong>Pago</strong>.
                </div>
              </div>

              {/* Box de Chave Pix para conferência se necessário */}
              <div
                style={{
                  background: "var(--bg-page)",
                  border: "1.5px dashed var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  padding: "0.75rem 1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.5rem",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Chave Pix da Van
                  </div>
                  <div style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--primary)", marginTop: "0.1rem" }}>
                    motorista@unidrive.com
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyPix("motorista@unidrive.com")}
                  style={{
                    background: copiedPix ? "var(--success-light)" : "var(--bg-card)",
                    border: "1px solid var(--border-subtle)",
                    color: copiedPix ? "var(--success-dark)" : "var(--primary-text)",
                    padding: "0.35rem 0.75rem",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    width: "auto",
                    minHeight: "32px",
                  }}
                >
                  {copiedPix ? "✓ Copiado!" : "Copiar Chave"}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: 1.5, margin: 0 }}>
                Sua mensalidade deste mês consta como pendente. Realize o pagamento diretamente ao motorista e informe abaixo:
              </p>

              {/* Box de Instrução e Cópia Pix */}
              <div
                style={{
                  background: "var(--bg-page)",
                  border: "1.5px dashed var(--border-subtle)",
                  borderRadius: "var(--radius-md)",
                  padding: "0.9rem 1rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "0.5rem",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase" }}>
                    Chave Pix da Van
                  </div>
                  <div style={{ fontSize: "0.92rem", fontWeight: 600, color: "var(--primary)", marginTop: "0.15rem" }}>
                    motorista@unidrive.com
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyPix("motorista@unidrive.com")}
                  style={{
                    background: copiedPix ? "var(--success-light)" : "var(--bg-card)",
                    border: "1px solid var(--border-subtle)",
                    color: copiedPix ? "var(--success-dark)" : "var(--primary-text)",
                    padding: "0.4rem 0.85rem",
                    borderRadius: "var(--radius-sm)",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer",
                    width: "auto",
                    minHeight: "36px",
                  }}
                >
                  {copiedPix ? "✓ Copiado!" : "Copiar Chave"}
                </button>
              </div>

              <Button
                variant="primary"
                onClick={handleNotifyPayment}
                isLoading={markingPaid}
                style={{ minHeight: "50px", fontSize: "1rem" }}
              >
                ✓ Já Paguei (Avisar Motorista)
              </Button>
            </div>
          )}

          {/* Configuração de Lembrete de Vencimento */}
          <div
            style={{
              borderTop: "1px solid var(--border-subtle)",
              paddingTop: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.4rem",
            }}
          >
            <label className="input-label" htmlFor="reminder-days-select">
              🔔 Lembrete de vencimento
            </label>
            <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <select
                id="reminder-days-select"
                value={reminderDays}
                onChange={(e) => handleUpdateReminder(Number(e.target.value))}
                disabled={savingReminder}
                style={{ flex: 1 }}
              >
                <option value={1}>1 dia antes do vencimento</option>
                <option value={2}>2 dias antes do vencimento</option>
                <option value={3}>3 dias antes do vencimento</option>
                <option value={5}>5 dias antes do vencimento</option>
                <option value={7}>7 dias antes do vencimento</option>
              </select>
            </div>
            <span style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
              Notificação push disparada caso a mensalidade permaneça pendente.
            </span>
          </div>
        </div>
      </Card>

      {/* Histórico de Mensalidades Anteriores */}
      <Card
        title="Histórico de Pagamentos"
        subtitle="Registro dos meses anteriores"
      >
        {previousHistory.length === 0 ? (
          <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "1rem 0", margin: 0 }}>
            Nenhum histórico anterior registrado.
          </p>
        ) : (
          <div className="item-list">
            {previousHistory.map((item) => (
              <div key={item.id} className="list-item">
                <div className="list-item-info">
                  <span className="list-item-title">
                    {formatMonth(item.referenceMonth)}
                  </span>
                  <span className="list-item-sub">
                    {item.paidAt
                      ? `Pago em ${formatDate(item.paidAt)} (Confirmado pelo motorista)`
                      : item.paymentRequestedAt
                      ? "Aguardando confirmação do motorista"
                      : "Pendente"}
                  </span>
                </div>
                <div>
                  {item.paidAt ? (
                    <Badge variant="success">Pago</Badge>
                  ) : item.paymentRequestedAt ? (
                    <Badge variant="warning">Aguardando</Badge>
                  ) : (
                    <Badge variant="danger">Pendente</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
