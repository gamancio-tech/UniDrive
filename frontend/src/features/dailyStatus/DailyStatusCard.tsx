import { DailyStatusValue } from "./useDailyStatus";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Badge } from "../../components/Badge";

interface DailyStatusCardProps {
  missingCount: number | null;
  cancelled: boolean;
  loading: boolean;
  isBoarded: boolean;
  currentStatus?: DailyStatusValue;
  lastUpdated?: Date | null;
  onSetStatus: (status: DailyStatusValue) => void;
  onCheckIn: () => void;
  onCancelBoardedSelf: () => void;
}

const STATUS_OPTIONS: { value: DailyStatusValue; label: string; icon: string; desc: string }[] = [
  { value: "vai_normal", label: "Vou normal", icon: "🚐", desc: "Ida e volta na van" },
  { value: "so_ida", label: "Só vou na ida", icon: "🌅", desc: "Não volto com a van" },
  { value: "so_volta", label: "Só volto", icon: "🌃", desc: "Apenas retorno da faculdade" },
  { value: "nao_vai", label: "Não vou hoje", icon: "🏠", desc: "Não usarei a van hoje" },
];

export function DailyStatusCard({
  missingCount,
  cancelled,
  loading,
  isBoarded,
  currentStatus,
  lastUpdated,
  onSetStatus,
  onCheckIn,
  onCancelBoardedSelf,
}: DailyStatusCardProps) {
  if (loading) {
    return (
      <Card title="Status do Dia">
        <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "1.5rem 0" }}>
          Carregando dados da van...
        </p>
      </Card>
    );
  }

  if (cancelled) {
    return (
      <Card
        title="Hoje não tem van"
        subtitle="Aviso do motorista"
        action={<Badge variant="danger">Cancelada</Badge>}
      >
        <div style={{ padding: "0.5rem 0" }}>
          <p style={{ color: "var(--text-muted)", lineHeight: 1.6, margin: 0 }}>
            O motorista cancelou as viagens de hoje. Verifique o mural de avisos para mais detalhes ou entre em contato com o motorista.
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
        <div>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0, color: "var(--text-main)" }}>
            Volta da Faculdade
          </h2>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "0.15rem 0 0" }}>
            Informe sua presença e acompanhe o embarque
          </p>
        </div>
        <Badge variant={isBoarded ? "success" : "info"}>
          {isBoarded ? "✓ A Bordo" : "Aguardando"}
        </Badge>
      </div>

      {/* Contador de Alunos Faltantes com Pulso Ao Vivo */}
      <div
        style={{
          background: "var(--bg-input)",
          borderRadius: "var(--radius-md)",
          padding: "1.25rem 1rem",
          textAlign: "center",
          margin: "0.75rem 0 1.25rem",
          border: "1px solid var(--border-subtle)",
        }}
      >
        <div
          className="stat-number"
          style={{
            fontSize: "3.2rem",
            fontWeight: 800,
            color: missingCount === 0 ? "var(--success-dark)" : "var(--primary-text)",
            lineHeight: 1,
          }}
        >
          {missingCount ?? 0}
        </div>
        <div style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--text-muted)", marginTop: "0.35rem" }}>
          {missingCount === 0
            ? "🎉 Todos os alunos já embarcaram!"
            : "aluno(s) restante(s) para a van partir"}
        </div>

        {lastUpdated && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "0.4rem",
              fontSize: "0.78rem",
              color: "var(--text-muted)",
              marginTop: "0.65rem",
            }}
          >
            <span className="live-dot" />
            <span>
              Atualizado às{" "}
              {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • Ao vivo
            </span>
          </div>
        )}
      </div>

      {/* Seleção do Status Diário — Cartões Táteis com Variáveis de Tema */}
      <div style={{ marginBottom: "1.25rem" }}>
        <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-main)", marginBottom: "0.6rem" }}>
          Seu status programado para hoje:
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6rem" }}>
          {STATUS_OPTIONS.map((option) => {
            const isSelected = option.value === (currentStatus ?? "vai_normal");
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onSetStatus(option.value)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  textAlign: "left",
                  padding: "0.85rem 0.9rem",
                  borderRadius: "var(--radius-md)",
                  background: isSelected ? "var(--primary-light)" : "var(--bg-card)",
                  border: isSelected ? "2px solid var(--primary-text)" : "1.5px solid var(--border-subtle)",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  boxShadow: isSelected ? "0 4px 14px rgba(11, 99, 206, 0.15)" : "none",
                  minHeight: "82px",
                  justifyContent: "center",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                  <span style={{ fontSize: "1.35rem" }}>{option.icon}</span>
                  {isSelected && (
                    <Badge variant="success" style={{ fontSize: "0.65rem", padding: "0.15rem 0.45rem" }}>
                      Ativo
                    </Badge>
                  )}
                </div>
                <div style={{ fontWeight: 700, fontSize: "0.88rem", color: isSelected ? "var(--primary-text)" : "var(--text-main)", marginTop: "0.35rem" }}>
                  {option.label}
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.1rem" }}>
                  {option.desc}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Área de Check-in de Embarque do Aluno */}
      <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "1rem" }}>
        {isBoarded ? (
          <div
            style={{
              background: "var(--success-light)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              borderRadius: "var(--radius-md)",
              padding: "1rem",
              display: "flex",
              flexDirection: "column",
              gap: "0.75rem",
              alignItems: "center",
              textAlign: "center",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "var(--success-dark)", fontWeight: 700, fontSize: "0.95rem" }}>
              <span>✅</span>
              <span>Você já está a bordo da van!</span>
            </div>
            <button
              type="button"
              onClick={onCancelBoardedSelf}
              style={{
                background: "var(--bg-card)",
                border: "1px solid var(--border-subtle)",
                color: "var(--danger-dark)",
                fontSize: "0.8rem",
                fontWeight: 600,
                padding: "0.45rem 1rem",
                borderRadius: "var(--radius-full)",
                cursor: "pointer",
                width: "auto",
                minHeight: "36px",
              }}
            >
              Desfazer / Não embarquei
            </button>
          </div>
        ) : !cancelled ? (
          <Button
            variant="primary"
            className="btn-giant"
            onClick={onCheckIn}
            style={{ width: "100%", fontSize: "1.05rem" }}
          >
            🎒 JÁ CHEGUEI NA VAN (CHECK-IN)
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
