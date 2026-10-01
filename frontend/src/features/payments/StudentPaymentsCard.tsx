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

  const handleMarkPaid = async () => {
    try {
      setMarkingPaid(true);
      const updated = await payMyCycle();
      setCurrentCycle(updated);
      // Atualiza também o histórico local
      setHistory((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
      showToast("Mensalidade marcada como paga!", "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erro ao registrar pagamento.", "error");
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
        <p style={{ textAlign: "center", color: "hsl(var(--text-secondary))", padding: "1.5rem 0" }}>
          Buscando mensalidades...
        </p>
      </Card>
    );
  }

  const isCurrentPaid = Boolean(currentCycle?.paidAt);
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
          ) : (
            <Badge variant="danger">Pendente</Badge>
          )
        }
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "0.25rem" }}>
          {isCurrentPaid ? (
            <div
              style={{
                background: "hsla(var(--success), 0.08)",
                border: "1px solid hsla(var(--success), 0.2)",
                borderRadius: "var(--radius-sm)",
                padding: "0.85rem 1rem",
                display: "flex",
                flexDirection: "column",
                gap: "0.3rem",
              }}
            >
              <div style={{ fontWeight: 600, color: "hsl(var(--success))" }}>
                ✓ Mensalidade quitada
              </div>
              <div style={{ fontSize: "0.85rem", color: "hsl(var(--text-secondary))" }}>
                Pagamento confirmado em {currentCycle?.paidAt ? formatDate(currentCycle.paidAt) : "data recente"}
                {currentCycle?.markedBy === "driver"
                  ? " (baixa confirmada pelo motorista)"
                  : " (marcado por você)"}
              </div>
            </div>
          ) : (
            <div>
              <p style={{ color: "hsl(var(--text-secondary))", fontSize: "0.9rem", lineHeight: 1.5, margin: 0 }}>
                Sua mensalidade deste mês ainda não foi marcada como paga. Quando realizar a transferência ou Pix para o motorista, marque abaixo:
              </p>
              <div style={{ marginTop: "1rem" }}>
                <Button
                  variant="primary"
                  onClick={handleMarkPaid}
                  isLoading={markingPaid}
                >
                  Marcar como Pago
                </Button>
              </div>
            </div>
          )}

          {/* Configuração de Lembrete de Vencimento */}
          <div
            style={{
              borderTop: "1px solid rgba(255, 255, 255, 0.08)",
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
            <span style={{ fontSize: "0.78rem", color: "hsl(var(--text-secondary))" }}>
              Notificação push enviada caso a mensalidade permaneça pendente.
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
          <p style={{ textAlign: "center", color: "hsl(var(--text-secondary))", padding: "1rem 0", margin: 0 }}>
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
                      ? `Pago em ${formatDate(item.paidAt)} (${item.markedBy === "driver" ? "Motorista" : "Você"})`
                      : "Pendente"}
                  </span>
                </div>
                <div>
                  {item.paidAt ? (
                    <Badge variant="success">Pago</Badge>
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
