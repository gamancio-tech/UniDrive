import { DailyStatusValue, TripType, TripStep } from "./useDailyStatus";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Badge } from "../../components/Badge";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faVanShuttle,
  faSun,
  faMoon,
  faHouse,
  faCircleCheck,
  faClock,
  faCheck,
  faUserCheck,
  IconDefinition,
} from "@fortawesome/free-solid-svg-icons";

interface DailyStatusCardProps {
  missingCount: number | null;
  cancelled: boolean;
  loading: boolean;
  isBoarded: boolean;
  currentStatus?: DailyStatusValue;
  currentTrip?: TripType;
  tripStep?: TripStep;
  lastUpdated?: Date | null;
  onSetStatus: (status: DailyStatusValue) => void;
  onCheckIn: () => void;
  onCancelBoardedSelf: () => void;
}

const STATUS_OPTIONS: { value: DailyStatusValue; label: string; icon: IconDefinition; desc: string }[] = [
  { value: "vai_normal", label: "Vou normal", icon: faVanShuttle, desc: "Ida e volta na van" },
  { value: "so_ida", label: "Só vou na ida", icon: faSun, desc: "Não volto com a van" },
  { value: "so_volta", label: "Só volto", icon: faMoon, desc: "Apenas retorno da faculdade" },
  { value: "nao_vai", label: "Não vou hoje", icon: faHouse, desc: "Não usarei a van hoje" },
];

export function DailyStatusCard({
  missingCount,
  cancelled,
  loading,
  isBoarded,
  currentStatus,
  currentTrip = "ida",
  tripStep = "aguardando",
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

  // O restante de alunos para embarcar só aparece no estado de esperar para a volta do motorista.
  const isWaitingForReturn = currentTrip === "volta" && tripStep === "aguardando";
  const isReturnTripStarted = currentTrip === "volta" && tripStep === "em_viagem";

  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
        <div>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0, color: "var(--text-main)" }}>
            Volta da Faculdade
          </h2>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "0.15rem 0 0" }}>
            {isWaitingForReturn
              ? "Embarque aberto • Acompanhe a saída ao vivo"
              : isReturnTripStarted
              ? "Viagem de retorno em andamento"
              : "Defina sua presença programada para hoje"}
          </p>
        </div>
        <Badge
          variant={
            isBoarded
              ? "success"
              : isReturnTripStarted
              ? "info"
              : isWaitingForReturn
              ? "warning"
              : "info"
          }
        >
          {isBoarded ? (
            <>
              <FontAwesomeIcon icon={faCheck} style={{ marginRight: "0.25rem" }} />
              A Bordo
            </>
          ) : isReturnTripStarted ? (
            "Viagem Iniciada"
          ) : isWaitingForReturn ? (
            "Embarque Aberto"
          ) : (
            "Programado"
          )}
        </Badge>
      </div>

      {/* 
        RF02: O restante de alunos para embarcar só aparece no estado de esperar para a volta do motorista.
        Depois que ele confirma o início de viagem, esse contador some também.
      */}
      {isWaitingForReturn ? (
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
            {missingCount === 0 ? (
              <>
                <FontAwesomeIcon icon={faCircleCheck} style={{ color: "var(--success, #22c55e)", marginRight: "0.35rem" }} />
                Todos os alunos já embarcaram!
              </>
            ) : (
              "aluno(s) restante(s) para a van partir"
            )}
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
      ) : isReturnTripStarted ? (
        <div
          style={{
            background: "var(--primary-light)",
            border: "1px solid rgba(11, 99, 206, 0.2)",
            borderRadius: "var(--radius-md)",
            padding: "1.1rem 1rem",
            textAlign: "center",
            margin: "0.75rem 0 1.25rem",
          }}
        >
          <div style={{ fontSize: "1.8rem", marginBottom: "0.25rem", color: "var(--primary)" }}>
            <FontAwesomeIcon icon={faVanShuttle} />
          </div>
          <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--primary-text)" }}>
            Viagem de Volta Iniciada
          </div>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
            {isBoarded
              ? "Você já está a bordo! Tenha uma ótima viagem de retorno."
              : "O motorista confirmou o início da viagem e a van já partiu."}
          </p>
        </div>
      ) : (
        <div
          style={{
            background: "var(--bg-input)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            padding: "0.85rem 1rem",
            textAlign: "center",
            margin: "0.75rem 0 1.25rem",
          }}
        >
          <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-muted)", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem" }}>
            <FontAwesomeIcon icon={faClock} />
            <span>O embarque da volta será aberto pelo motorista no término das aulas</span>
          </div>
          <p style={{ margin: "0.2rem 0 0", fontSize: "0.76rem", color: "var(--text-light)" }}>
            Defina sua presença programada no painel abaixo
          </p>
        </div>
      )}

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
                  <span style={{ fontSize: "1.25rem", color: isSelected ? "var(--primary-text)" : "var(--text-muted)" }}>
                    <FontAwesomeIcon icon={option.icon} />
                  </span>
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
              <FontAwesomeIcon icon={faCircleCheck} />
              <span>Você já está a bordo da van!</span>
            </div>
            {!isReturnTripStarted && (
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
            )}
          </div>
        ) : isWaitingForReturn && !cancelled ? (
          <Button
            variant="primary"
            className="btn-giant"
            onClick={onCheckIn}
            style={{ width: "100%", fontSize: "1.05rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
          >
            <FontAwesomeIcon icon={faUserCheck} />
            <span>JÁ CHEGUEI NA VAN (CHECK-IN)</span>
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
