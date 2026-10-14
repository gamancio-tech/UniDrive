import React, { useState } from "react";
import { DailyStatusValue, TripStep } from "./useDailyStatus";
import { isStudentInTrip, type TripType } from "../../utils/trip";
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
  faGraduationCap,
  faLightbulb,
  faChevronDown,
  faChevronUp,
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
  currentStatus = "vai_normal",
  currentTrip = "ida",
  tripStep = "aguardando",
  lastUpdated,
  onSetStatus,
  onCheckIn,
  onCancelBoardedSelf,
}: DailyStatusCardProps) {
  const [isHelpOpen, setIsHelpOpen] = useState(false);

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

  const isIda = currentTrip === "ida";
  const isVolta = currentTrip === "volta";
  const isWaitingForReturn = isVolta && tripStep === "aguardando";
  const isReturnTripStarted = isVolta && tripStep === "em_viagem";

  // Determina se o aluno está previsto para o trajeto atual
  const isScheduledForCurrentTrip = isStudentInTrip(currentStatus, isIda ? "ida" : "volta");

  // Título e subtítulo dinâmicos da viagem
  const tripTitle = isIda ? "Ida para a Faculdade" : "Volta da Faculdade";
  const tripSubtitle = isIda
    ? isBoarded
      ? "Embarque confirmado • A caminho da faculdade"
      : !isScheduledForCurrentTrip
      ? "Você informou que não vai de van na ida hoje"
      : "Embarque da ida aberto • Confirme ao entrar na van"
    : isReturnTripStarted
    ? "Viagem de retorno em andamento • Van a caminho das residências"
    : isWaitingForReturn
    ? "Embarque aberto no campus • Acompanhe a saída ao vivo"
    : "Aguardando término das aulas para iniciar embarque";

  // Badge dinâmica de status
  let badgeVariant: "success" | "warning" | "info" | "neutral" = "info";
  let badgeText = "Programado";
  let badgeIcon: IconDefinition | null = null;

  if (isBoarded) {
    badgeVariant = "success";
    badgeText = "A Bordo";
    badgeIcon = faCheck;
  } else if (isReturnTripStarted) {
    badgeVariant = "info";
    badgeText = "Em Viagem";
    badgeIcon = faVanShuttle;
  } else if (isWaitingForReturn) {
    badgeVariant = "warning";
    badgeText = "Embarque Aberto";
  } else if (!isScheduledForCurrentTrip) {
    badgeVariant = "neutral";
    badgeText = "Não Vai Hoje";
  } else if (isIda) {
    badgeVariant = "info";
    badgeText = "Embarque Aberto";
  }

  return (
    <Card>
      {/* 1. Indicador visual das etapas da rotina diária (Stepper) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--bg-input)",
          border: "1px solid var(--border-subtle)",
          borderRadius: "var(--radius-md)",
          padding: "0.5rem 0.75rem",
          marginBottom: "0.85rem",
          fontSize: "0.74rem",
          color: "var(--text-muted)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.3rem",
            fontWeight: isIda ? 700 : 500,
            color: isIda ? "var(--primary-text)" : "var(--text-light)",
          }}
        >
          <FontAwesomeIcon icon={faSun} />
          <span>1. Ida</span>
        </div>
        <span style={{ color: "var(--text-light)" }}>→</span>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.3rem",
            fontWeight: !isIda && !isWaitingForReturn && !isReturnTripStarted ? 700 : 500,
            color: !isIda && !isWaitingForReturn && !isReturnTripStarted ? "var(--primary-text)" : "var(--text-light)",
          }}
        >
          <FontAwesomeIcon icon={faGraduationCap} />
          <span>2. Aulas</span>
        </div>
        <span style={{ color: "var(--text-light)" }}>→</span>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.3rem",
            fontWeight: isWaitingForReturn ? 700 : 500,
            color: isWaitingForReturn ? "var(--accent-gold-dark, #b45309)" : "var(--text-light)",
          }}
        >
          <FontAwesomeIcon icon={faClock} />
          <span>3. Volta Aberta</span>
        </div>
        <span style={{ color: "var(--text-light)" }}>→</span>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.3rem",
            fontWeight: isReturnTripStarted ? 700 : 500,
            color: isReturnTripStarted ? "var(--success-dark)" : "var(--text-light)",
          }}
        >
          <FontAwesomeIcon icon={faVanShuttle} />
          <span>4. Retorno</span>
        </div>
      </div>

      {/* 2. Cabeçalho com Título Dinâmico e Badge */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
        <div>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 700, margin: 0, color: "var(--text-main)" }}>
            {tripTitle}
          </h2>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", margin: "0.15rem 0 0" }}>
            {tripSubtitle}
          </p>
        </div>
        <Badge variant={badgeVariant}>
          {badgeIcon && <FontAwesomeIcon icon={badgeIcon} style={{ marginRight: "0.25rem" }} />}
          {badgeText}
        </Badge>
      </div>

      {/* 3. Seção Central de Informação / Contador / Status */}
      {isIda ? (
        /* Trajeto de IDA */
        isBoarded ? (
          <div
            style={{
              background: "var(--success-light)",
              border: "1px solid rgba(34, 197, 94, 0.3)",
              borderRadius: "var(--radius-md)",
              padding: "1.1rem 1rem",
              textAlign: "center",
              margin: "0.75rem 0 1.25rem",
            }}
          >
            <div style={{ fontSize: "1.8rem", marginBottom: "0.25rem", color: "var(--success-dark)" }}>
              <FontAwesomeIcon icon={faCircleCheck} />
            </div>
            <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "var(--success-dark)" }}>
              Você já está a bordo da Ida!
            </div>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
              Tenha uma excelente aula na faculdade.
            </p>
          </div>
        ) : !isScheduledForCurrentTrip ? (
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
              <FontAwesomeIcon icon={faSun} />
              <span>Você informou que não usará a van na ida</span>
            </div>
            <p style={{ margin: "0.2rem 0 0", fontSize: "0.76rem", color: "var(--text-light)" }}>
              Seu retorno da faculdade permanece programado conforme seu status diário.
            </p>
          </div>
        ) : (
          <div
            style={{
              background: "var(--bg-input)",
              borderRadius: "var(--radius-md)",
              padding: "1.15rem 1rem",
              textAlign: "center",
              margin: "0.75rem 0 1.25rem",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div style={{ fontSize: "1.8rem", color: "var(--primary)", marginBottom: "0.3rem" }}>
              <FontAwesomeIcon icon={faSun} />
            </div>
            <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "var(--text-main)" }}>
              Embarque da Ida para a Faculdade
            </div>
            <p style={{ margin: "0.25rem 0 0", fontSize: "0.82rem", color: "var(--text-muted)", lineHeight: 1.4 }}>
              Assim que avistar ou entrar na van, clique no botão de <strong>Check-in</strong> abaixo para avisar o motorista.
            </p>
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
                  Atualizado às {lastUpdated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} • Ao vivo
                </span>
              </div>
            )}
          </div>
        )
      ) : isWaitingForReturn ? (
        /* Trajeto de VOLTA: Espera de alunos aberta no campus com contador ao vivo */
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

          {!isScheduledForCurrentTrip && (
            <p style={{ margin: "0.45rem 0 0", fontSize: "0.78rem", color: "var(--text-light)" }}>
              (Você informou que não volta na van hoje)
            </p>
          )}

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
        /* Trajeto de VOLTA: Van já partiu */
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
        /* Estado intermediário / Aguardando abertura */
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

      {/* 4. Seleção do Status Diário — Cartões Táteis */}
      <div style={{ marginBottom: "1.25rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.45rem" }}>
          <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "var(--text-main)", margin: 0 }}>
            Sua presença programada para hoje:
          </p>
          <span style={{ fontSize: "0.74rem", color: "var(--text-light)" }}>
            Padrão diário: Vou normal
          </span>
        </div>

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

      {/* 5. Área de Check-in de Embarque do Aluno */}
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
        ) : isReturnTripStarted ? (
          <p style={{ textAlign: "center", color: "var(--text-muted)", fontSize: "0.85rem", margin: "0.5rem 0" }}>
            A viagem de volta já partiu do campus. O check-in deste trajeto está encerrado.
          </p>
        ) : !isScheduledForCurrentTrip ? (
          <div
            style={{
              background: "var(--bg-input)",
              borderRadius: "var(--radius-md)",
              padding: "0.75rem 1rem",
              textAlign: "center",
              fontSize: "0.82rem",
              color: "var(--text-muted)",
            }}
          >
            Você definiu que não usará a van neste trajeto ({isIda ? "Ida" : "Volta"}). Se você mudou de ideia e está na van, altere sua opção acima para liberar o check-in.
          </div>
        ) : !cancelled ? (
          <Button
            variant="primary"
            className="btn-giant"
            onClick={onCheckIn}
            style={{ width: "100%", fontSize: "1.05rem", display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem" }}
          >
            <FontAwesomeIcon icon={faUserCheck} />
            <span>JÁ CHEGUEI NA VAN (CHECK-IN DE {isIda ? "IDA" : "VOLTA"})</span>
          </Button>
        ) : null}
      </div>

      {/* 6. Dica Didática Expansível de UX — Como Funciona o Embarque */}
      <div style={{ marginTop: "1rem", borderTop: "1px dashed var(--border-subtle)", paddingTop: "0.75rem" }}>
        <button
          type="button"
          onClick={() => setIsHelpOpen((prev) => !prev)}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--primary)",
            fontSize: "0.8rem",
            fontWeight: 600,
            cursor: "pointer",
            padding: 0,
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
          }}
        >
          <FontAwesomeIcon icon={faLightbulb} style={{ color: "var(--accent-gold, #f59e0b)" }} />
          <span>Como funciona o embarque na van?</span>
          <FontAwesomeIcon icon={isHelpOpen ? faChevronUp : faChevronDown} style={{ fontSize: "0.7rem" }} />
        </button>

        {isHelpOpen && (
          <div
            style={{
              background: "var(--bg-input)",
              border: "1px solid var(--border-subtle)",
              borderRadius: "var(--radius-md)",
              padding: "0.85rem",
              marginTop: "0.5rem",
              fontSize: "0.78rem",
              color: "var(--text-muted)",
              lineHeight: 1.5,
              display: "flex",
              flexDirection: "column",
              gap: "0.45rem",
            }}
          >
            <div>
              <strong style={{ color: "var(--text-main)" }}>1. Presença Automática:</strong> Por padrão você está confirmado todo dia como <em>"Vou normal"</em>. Você só precisa mexer nos botões se for faltar ou usar só um trajeto.
            </div>
            <div>
              <strong style={{ color: "var(--text-main)" }}>2. Check-in ao Entrar:</strong> Ao entrar na van de manhã ou no fim da aula, clique em <em>"Já cheguei na van"</em>. O motorista e colegas veem na hora que você já embarcou.
            </div>
            <div>
              <strong style={{ color: "var(--text-main)" }}>3. Contador na Saída:</strong> No término das aulas, o contador mostra quantos faltam para a van partir. Quando faltarem apenas 1 ou 2 alunos, quem ainda não embarcou recebe um aviso push no celular.
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}
