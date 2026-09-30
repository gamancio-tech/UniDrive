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

const STATUS_OPTIONS: { value: DailyStatusValue; label: string; icon: string }[] = [
  { value: "vai_normal", label: "Vou normal (ida e volta)", icon: "🚌" },
  { value: "so_ida", label: "Só vou na ida", icon: "🌅" },
  { value: "so_volta", label: "Só volto", icon: "🌃" },
  { value: "nao_vai", label: "Não vou hoje", icon: "🏠" },
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
        <p style={{ textAlign: "center", color: "hsl(var(--text-secondary))" }}>Carregando dados da van...</p>
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
        <p style={{ color: "hsl(var(--text-secondary))", lineHeight: 1.6 }}>
          O motorista cancelou as viagens de hoje. Verifique o mural de avisos para mais detalhes ou entre em contato se necessário.
        </p>
      </Card>
    );
  }

  return (
    <Card
      title="Volta da Faculdade"
      subtitle="Informe sua presença para ajudar a coordenar a van"
      action={
        <Badge variant={isBoarded ? "success" : "info"}>
          {isBoarded ? "Embarcado" : "Aguardando"}
        </Badge>
      }
    >
      <div style={{ textAlign: "center", padding: "1.25rem 0" }}>
        <div className="stat-number" style={{ fontSize: "3.5rem" }}>
          {missingCount ?? 0}
        </div>
        <div className="stat-label">aluno(s) restante(s) para a van sair</div>
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

      <div style={{ margin: "1rem 0" }}>
        <p className="input-label" style={{ marginBottom: "0.5rem" }}>
          Seu status programado para hoje:
        </p>
        <div className="button-group" style={{ margin: "0.5rem 0" }}>
          {STATUS_OPTIONS.map((option) => {
            const isSelected = option.value === (currentStatus ?? "vai_normal");
            return (
              <Button
                key={option.value}
                variant={isSelected ? "primary" : "secondary"}
                style={{
                  justifyContent: "space-between",
                  textAlign: "left",
                  border: isSelected ? "1px solid hsl(var(--accent-primary-hover))" : undefined,
                  boxShadow: isSelected ? "0 4px 14px rgba(116, 92, 237, 0.4)" : undefined,
                  fontWeight: isSelected ? 600 : 400,
                }}
                onClick={() => onSetStatus(option.value)}
              >
                <div style={{ display: "inline-flex", alignItems: "center" }}>
                  <span style={{ fontSize: "1.2rem", marginRight: "0.5rem" }}>{option.icon}</span>
                  <span>{option.label}</span>
                </div>
                {isSelected && (
                  <Badge variant="success">✓ Ativo</Badge>
                )}
              </Button>
            );
          })}
        </div>
      </div>

      <div style={{ borderTop: "1px solid rgba(255, 255, 255, 0.08)", paddingTop: "1rem", marginTop: "1rem" }}>
        {isBoarded ? (
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.75rem", color: "hsl(var(--success))" }}>
              <span>✅</span>
              <strong>Você marcou que já está na van!</strong>
            </div>
            <Button variant="danger" onClick={onCancelBoardedSelf} style={{ width: "100%" }}>
              Desfazer / Não estou na van
            </Button>
          </div>
        ) : !cancelled ? (
          <Button variant="primary" onClick={onCheckIn} style={{ width: "100%", padding: "0.9rem" }}>
            🎒 Já cheguei na van (Check-in)
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
