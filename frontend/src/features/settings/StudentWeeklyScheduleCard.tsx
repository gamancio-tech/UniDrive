import React, { useState, useEffect } from "react";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Badge } from "../../components/Badge";
import { useToast } from "../../components/Toast";
import { DailyStatusValue } from "../dailyStatus/useDailyStatus";
import {
  getWeeklySchedule,
  updateWeeklySchedule,
  WeeklyScheduleDay,
} from "../../api/weeklySchedule";

const STATUS_CONFIG: Record<
  DailyStatusValue,
  { label: string; shortLabel: string; icon: string; badgeVariant: "success" | "warning" | "info" | "neutral" }
> = {
  vai_normal: {
    label: "Vou normal (Ida e Volta)",
    shortLabel: "Vou normal",
    icon: "🚐",
    badgeVariant: "success",
  },
  so_ida: {
    label: "Só vou na ida",
    shortLabel: "Só ida",
    icon: "🌅",
    badgeVariant: "warning",
  },
  so_volta: {
    label: "Só volto",
    shortLabel: "Só volta",
    icon: "🌃",
    badgeVariant: "info",
  },
  nao_vai: {
    label: "Não vou (Folga)",
    shortLabel: "Não vou",
    icon: "🏠",
    badgeVariant: "neutral",
  },
};

const OPTIONS: DailyStatusValue[] = ["vai_normal", "so_ida", "so_volta", "nao_vai"];

export const StudentWeeklyScheduleCard: React.FC = () => {
  const { showToast } = useToast();
  const [schedule, setSchedule] = useState<WeeklyScheduleDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSchedule();
  }, []);

  async function loadSchedule() {
    try {
      setLoading(true);
      const data = await getWeeklySchedule();
      setSchedule(data);
      setHasChanges(false);
    } catch (err: unknown) {
      console.error("Erro ao carregar rotina semanal:", err);
      showToast("Não foi possível carregar sua rotina semanal.", "error");
    } finally {
      setLoading(false);
    }
  }

  function handleSelectStatus(dayOfWeek: number, status: DailyStatusValue) {
    setSchedule((prev) =>
      prev.map((day) => (day.dayOfWeek === dayOfWeek ? { ...day, status } : day))
    );
    setHasChanges(true);
  }

  async function handleSave() {
    try {
      setSaving(true);
      const payload = schedule.map((s) => ({
        dayOfWeek: s.dayOfWeek,
        status: s.status,
      }));
      const res = await updateWeeklySchedule(payload);
      setSchedule(res.schedules);
      setHasChanges(false);
      showToast("Rotina semanal salva com sucesso! Seus dias padrão foram atualizados.", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erro ao salvar rotina semanal.";
      showToast(msg, "error");
    } finally {
      setSaving(false);
    }
  }

  // Estatísticas rápidas da semana do aluno
  const activeDaysCount = schedule.filter((s) => s.status !== "nao_vai").length;
  const offDays = schedule.filter((s) => s.status === "nao_vai");

  return (
    <Card
      title="Rotina Semanal Padrão"
      subtitle="Defina seus dias de aula e folga padrão. Essa configuração é aplicada automaticamente na semana."
      action={
        <Badge variant={hasChanges ? "warning" : "info"}>
          {hasChanges ? "Alterações pendentes" : `${activeDaysCount} dias na van`}
        </Badge>
      }
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginTop: "0.35rem" }}>
        {/* Informativo de facilidade de uso */}
        <div
          style={{
            background: "var(--bg-input)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            padding: "0.85rem 1rem",
            fontSize: "0.84rem",
            color: "var(--text-muted)",
            lineHeight: 1.5,
          }}
        >
          💡 <strong>Como funciona:</strong> Se você só vai para a faculdade 4 dias na semana, marque o dia de folga como <strong>"Não vou"</strong>. O sistema assumirá isso como seu padrão semanal. Em qualquer dia que você precisar mudar excepcionalmente, basta alterar direto na tela inicial.
        </div>

        {/* Resumo da rotina atual */}
        {!loading && offDays.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "var(--primary-light)",
              border: "1px solid rgba(11, 99, 206, 0.2)",
              borderRadius: "var(--radius-md)",
              padding: "0.75rem 0.9rem",
              fontSize: "0.84rem",
              color: "var(--text-main)",
            }}
          >
            <span>🗓️</span>
            <span>
              <strong>Folga programada:</strong> {offDays.map((d) => d.dayName).join(", ")}
            </span>
          </div>
        )}

        {loading ? (
          <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "1.5rem 0" }}>
            Carregando calendário semanal...
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
            {schedule.map((day) => {
              const currentConfig = STATUS_CONFIG[day.status];
              return (
                <div
                  key={day.dayOfWeek}
                  style={{
                    background: "var(--bg-card)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "var(--radius-md)",
                    padding: "0.85rem 0.95rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.6rem",
                  }}
                >
                  {/* Cabeçalho do Dia */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                      <span style={{ fontSize: "1.1rem" }}>📅</span>
                      <span
                        style={{
                          fontWeight: 700,
                          fontSize: "0.95rem",
                          color: "var(--text-main)",
                        }}
                      >
                        {day.dayName}
                      </span>
                    </div>

                    <Badge variant={currentConfig.badgeVariant}>
                      {currentConfig.icon} {currentConfig.shortLabel}
                    </Badge>
                  </div>

                  {/* Seletor em Pílulas / Grid de 4 opções */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))",
                      gap: "0.45rem",
                    }}
                  >
                    {OPTIONS.map((opt) => {
                      const isSelected = day.status === opt;
                      const optConfig = STATUS_CONFIG[opt];
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleSelectStatus(day.dayOfWeek, opt)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "0.35rem",
                            padding: "0.45rem 0.4rem",
                            borderRadius: "var(--radius-sm)",
                            border: isSelected
                              ? "1.5px solid var(--primary)"
                              : "1px solid var(--border-subtle)",
                            background: isSelected ? "var(--primary-light)" : "var(--bg-input)",
                            color: isSelected ? "var(--primary-text)" : "var(--text-muted)",
                            fontWeight: isSelected ? 700 : 500,
                            fontSize: "0.78rem",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                            minHeight: "36px",
                          }}
                        >
                          <span>{optConfig.icon}</span>
                          <span>{optConfig.shortLabel}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Botão de Salvar Alterações */}
        <div style={{ marginTop: "0.5rem" }}>
          <Button
            variant="primary"
            onClick={handleSave}
            isLoading={saving}
            disabled={loading || !hasChanges}
            style={{ width: "100%", minHeight: "48px", fontSize: "0.98rem" }}
          >
            {saving ? "Salvando..." : "💾 Salvar Rotina Semanal"}
          </Button>
        </div>
      </div>
    </Card>
  );
};
