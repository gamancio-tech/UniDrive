import React, { useState, useEffect, useCallback, useMemo } from "react";
import { apiRequest } from "../../api/client";
import { Card } from "../../components/Card";
import { Button } from "../../components/Button";
import { Input } from "../../components/Input";
import { Modal } from "../../components/Modal";
import { Badge } from "../../components/Badge";
import { Avatar } from "../../components/Avatar";
import { useToast } from "../../components/Toast";
import {
  PaymentCycle,
  getStudentPaymentStatus,
  markStudentPaidByDriver,
  rejectStudentPaymentByDriver,
} from "../../api/payments";
import {
  deactivateDriverStudent,
  reactivateDriverStudent,
  resetAllDailyBoarded,
  getDriverStudents,
  getStudentsByStatus,
  DriverStudent,
  RegisteredStudent,
} from "../../api/students";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faSun,
  faMoon,
  faFlagCheckered,
  faCircleCheck,
  faVanShuttle,
  faCheck,
  faUsers,
  faShieldHalved,
  faHourglassHalf,
  faTrashCan,
  faRotateRight,
} from "@fortawesome/free-solid-svg-icons";

export type TripType = "ida" | "volta";
type StudentTab = "a_embarcar" | "embarcados" | "todos";
type StudentStatusSubTab = "active" | "inactive";

export interface DriverStudentListProps {
  tripType?: TripType;
  onTripChange?: (trip: TripType) => void;
  onTripFinished?: () => void;
}

const POLL_INTERVAL_MS = 15_000;

export const DriverStudentList: React.FC<DriverStudentListProps> = ({
  tripType: controlledTripType,
  onTripChange,
  onTripFinished,
}) => {
  const { showToast } = useToast();
  // Alunos com status diário para os trajetos de Ida e Volta (RF01/RF04)
  const [dailyStudents, setDailyStudents] = useState<DriverStudent[]>([]);
  // Alunos cadastrados (sem status diário de viagem) (RF09)
  const [activeStudents, setActiveStudents] = useState<RegisteredStudent[]>([]);
  const [inactiveStudents, setInactiveStudents] = useState<RegisteredStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<StudentTab>("a_embarcar");
  const [allStudentsSubTab, setAllStudentsSubTab] = useState<StudentStatusSubTab>("active");

  const [internalTripType, setInternalTripType] = useState<TripType>(() => {
    const saved = localStorage.getItem("unidrive_driver_trip_type");
    return saved === "volta" ? "volta" : "ida";
  });

  const tripType = controlledTripType ?? internalTripType;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFinishTripModalOpen, setIsFinishTripModalOpen] = useState(false);
  const [finishingTrip, setFinishingTrip] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const [paymentStatuses, setPaymentStatuses] = useState<Record<string, PaymentCycle>>({});
  const [markingPaidId, setMarkingPaidId] = useState<string | null>(null);
  const [rejectingPaymentId, setRejectingPaymentId] = useState<string | null>(null);
  const [studentToDeactivate, setStudentToDeactivate] = useState<RegisteredStudent | null>(null);
  const [deactivating, setDeactivating] = useState(false);
  const [reactivatingId, setReactivatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");

  const loadStudents = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const [dailyData, activeData, inactiveData] = await Promise.all([
        getDriverStudents(),
        getStudentsByStatus(true),
        getStudentsByStatus(false),
      ]);
      setDailyStudents(dailyData);
      setActiveStudents(activeData);
      setInactiveStudents(inactiveData);

      const paymentEntries = await Promise.allSettled(
        activeData.map(async (s) => {
          const status = await getStudentPaymentStatus(s.id);
          return { id: s.id, status };
        })
      );
      const paymentMap: Record<string, PaymentCycle> = {};
      paymentEntries.forEach((entry) => {
        if (entry.status === "fulfilled") {
          paymentMap[entry.value.id] = entry.value.status;
        }
      });
      setPaymentStatuses(paymentMap);
    } catch (err: unknown) {
      console.error("Erro ao carregar alunos:", err);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStudents(true);
    const interval = setInterval(() => loadStudents(false), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadStudents]);

  // Alunos que participam do trajeto atual (apenas ativos)
  const tripFilteredStudents = useMemo(() => {
    return dailyStudents.filter((s) => {
      const status = s.todayStatus || "vai_normal";
      if (tripType === "ida") {
        return status === "vai_normal" || status === "so_ida";
      } else {
        return status === "vai_normal" || status === "so_volta";
      }
    });
  }, [dailyStudents, tripType]);

  // Lista 1: Alunos que vão mas ainda não embarcaram
  const pendingStudents = useMemo(() => {
    return tripFilteredStudents.filter((s) => !s.isBoarded);
  }, [tripFilteredStudents]);

  // Lista 2: Alunos da viagem atual que já foram buscados / embarcados
  const boardedStudents = useMemo(() => {
    return tripFilteredStudents.filter((s) => Boolean(s.isBoarded));
  }, [tripFilteredStudents]);

  const handleSelectTrip = (type: TripType) => {
    if (onTripChange) {
      onTripChange(type);
    } else {
      setInternalTripType(type);
      localStorage.setItem("unidrive_driver_trip_type", type);
    }
  };

  const handleConfirmFinishTrip = async () => {
    try {
      setFinishingTrip(true);
      await resetAllDailyBoarded();

      // Zera localmente o embarque de todos os alunos do trajeto diário
      setDailyStudents((prev) => prev.map((s) => ({ ...s, isBoarded: false })));

      // Alterna o trajeto entre Ida e Volta
      const nextTrip: TripType = tripType === "ida" ? "volta" : "ida";
      handleSelectTrip(nextTrip);

      // Redireciona para a lista "A Embarcar" do novo trajeto
      setActiveTab("a_embarcar");
      setIsFinishTripModalOpen(false);
      onTripFinished?.();

      showToast(
        `Viagem de ${tripType === "ida" ? "Ida" : "Volta"} finalizada! Lista de ${nextTrip === "ida" ? "Ida" : "Volta"} iniciada.`,
        "success"
      );
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erro ao finalizar viagem.", "error");
    } finally {
      setFinishingTrip(false);
    }
  };

  const getTodayStatusBadge = (status?: string) => {
    switch (status) {
      case "so_ida":
        return <Badge variant="neutral">Só ida</Badge>;
      case "so_volta":
        return <Badge variant="info">Só volta</Badge>;
      case "nao_vai":
        return <Badge variant="danger">Não vai</Badge>;
      case "vai_normal":
      default:
        return <Badge variant="info">Vai normal</Badge>;
    }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await apiRequest("/students", {
        method: "POST",
        body: { name, email, temporaryPassword },
      });
      setIsModalOpen(false);
      setName("");
      setEmail("");
      setTemporaryPassword("");
      await loadStudents();
      showToast("Aluno cadastrado com sucesso!", "success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar aluno.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualCheckIn = async (studentId: string) => {
    try {
      setCheckingInId(studentId);
      await apiRequest(`/daily-status/checkin/${studentId}`, {
        method: "POST",
      });
      setDailyStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, isBoarded: true } : s))
      );
      showToast("Embarque registrado!", "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erro ao confirmar embarque.", "error");
    } finally {
      setCheckingInId(null);
    }
  };

  const handleUndoCheckIn = async (studentId: string) => {
    try {
      setCheckingInId(studentId);
      await apiRequest(`/daily-status/cancel-boarded/${studentId}`, {
        method: "POST",
      });
      setDailyStudents((prev) =>
        prev.map((s) => (s.id === studentId ? { ...s, isBoarded: false } : s))
      );
      showToast("Embarque desfeito.", "info");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erro ao desfazer embarque.", "error");
    } finally {
      setCheckingInId(null);
    }
  };

  const handleConfirmPayment = async (studentId: string) => {
    try {
      setMarkingPaidId(studentId);
      const updated = await markStudentPaidByDriver(studentId);
      setPaymentStatuses((prev) => ({ ...prev, [studentId]: updated }));
      showToast("Pagamento confirmado com sucesso!", "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erro ao confirmar pagamento.", "error");
    } finally {
      setMarkingPaidId(null);
    }
  };

  const handleRejectPayment = async (studentId: string) => {
    try {
      setRejectingPaymentId(studentId);
      const updated = await rejectStudentPaymentByDriver(studentId);
      setPaymentStatuses((prev) => ({ ...prev, [studentId]: updated }));
      showToast("Solicitação de pagamento recusada.", "info");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erro ao recusar pagamento.", "error");
    } finally {
      setRejectingPaymentId(null);
    }
  };

  const handleConfirmDeactivate = async () => {
    if (!studentToDeactivate) return;
    try {
      setDeactivating(true);
      await deactivateDriverStudent(studentToDeactivate.id);
      setActiveStudents((prev) => prev.filter((s) => s.id !== studentToDeactivate.id));
      setInactiveStudents((prev) =>
        [...prev, { ...studentToDeactivate, active: false }].sort((a, b) => a.name.localeCompare(b.name))
      );
      setDailyStudents((prev) => prev.filter((s) => s.id !== studentToDeactivate.id));
      setStudentToDeactivate(null);
      showToast(`Aluno "${studentToDeactivate.name}" movido para inativos com sucesso!`, "info");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erro ao desativar aluno.", "error");
    } finally {
      setDeactivating(false);
    }
  };

  const handleReactivateStudent = async (student: RegisteredStudent) => {
    try {
      setReactivatingId(student.id);
      await reactivateDriverStudent(student.id);
      setInactiveStudents((prev) => prev.filter((s) => s.id !== student.id));
      setActiveStudents((prev) =>
        [...prev, { ...student, active: true }].sort((a, b) => a.name.localeCompare(b.name))
      );
      await loadStudents();
      showToast(`Aluno "${student.name}" reativado na van com sucesso!`, "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erro ao reativar aluno.", "error");
    } finally {
      setReactivatingId(null);
    }
  };

  const cardSubtitle = useMemo(() => {
    if (activeTab === "a_embarcar") {
      return `${pendingStudents.length} aluno(s) a buscar na ${tripType === "ida" ? "Ida" : "Volta"}`;
    }
    if (activeTab === "embarcados") {
      return `${boardedStudents.length} passageiro(s) a bordo na ${tripType === "ida" ? "Ida" : "Volta"}`;
    }
    return `${activeStudents.length} ativo(s) • ${inactiveStudents.length} inativo(s)`;
  }, [
    activeTab,
    pendingStudents.length,
    boardedStudents.length,
    activeStudents.length,
    inactiveStudents.length,
    tripType,
  ]);

  return (
    <>
      <Card
        title="Meus Alunos"
        subtitle={cardSubtitle}
        action={
          activeTab === "todos" ? (
            <Button
              variant="primary"
              onClick={() => setIsModalOpen(true)}
              style={{ width: "auto", minHeight: "38px", padding: "0.4rem 0.95rem", fontSize: "0.85rem" }}
            >
              + Novo Aluno
            </Button>
          ) : undefined
        }
      >
        {/* Painel de Controle de Trajeto (Ida / Volta / Finalizar Viagem) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.75rem",
            background: "var(--bg-input)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            padding: "0.6rem 0.85rem",
            marginBottom: "1rem",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap" }}>
            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 600 }}>
              Trajeto:
            </span>
            <button
              type="button"
              onClick={() => handleSelectTrip("ida")}
              className={`filter-pill ${tripType === "ida" ? "active" : ""}`}
              style={{ minHeight: "32px", padding: "0.2rem 0.75rem", fontSize: "0.8rem" }}
            >
              <FontAwesomeIcon icon={faSun} style={{ marginRight: "0.35rem" }} />
              Ida
            </button>
            <button
              type="button"
              onClick={() => handleSelectTrip("volta")}
              className={`filter-pill ${tripType === "volta" ? "active" : ""}`}
              style={{ minHeight: "32px", padding: "0.2rem 0.75rem", fontSize: "0.8rem" }}
            >
              <FontAwesomeIcon icon={faMoon} style={{ marginRight: "0.35rem" }} />
              Volta
            </button>
          </div>

          <Button
            variant="primary"
            onClick={() => setIsFinishTripModalOpen(true)}
            style={{
              width: "auto",
              minHeight: "34px",
              padding: "0.35rem 0.85rem",
              fontSize: "0.82rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
            }}
          >
            <FontAwesomeIcon icon={faFlagCheckered} />
            <span>Finalizar {tripType === "ida" ? "Ida" : "Volta"}</span>
          </Button>
        </div>

        {/* Abas de Navegação entre as 3 Listas */}
        <div className="tabs-container">
          <button
            type="button"
            className={`tab-btn ${activeTab === "a_embarcar" ? "active" : ""}`}
            onClick={() => setActiveTab("a_embarcar")}
          >
            A Embarcar ({pendingStudents.length})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "embarcados" ? "active" : ""}`}
            onClick={() => setActiveTab("embarcados")}
          >
            Embarcados ({boardedStudents.length})
          </button>
          <button
            type="button"
            className={`tab-btn ${activeTab === "todos" ? "active" : ""}`}
            onClick={() => setActiveTab("todos")}
          >
            Todos ({activeStudents.length + inactiveStudents.length})
          </button>
        </div>

        {loading ? (
          <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "1.5rem 0" }}>
            Carregando passageiros...
          </p>
        ) : (
          <>
            {/* 1. ABA: A EMBARCAR (Alunos ativos que vão no trajeto atual e ainda não entraram) */}
            {activeTab === "a_embarcar" && (
              <>
                {pendingStudents.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--text-muted)" }}>
                    <div style={{ fontSize: "2.2rem", marginBottom: "0.5rem", color: "var(--success, #22c55e)" }}>
                      <FontAwesomeIcon icon={faCircleCheck} />
                    </div>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-main)", margin: "0 0 0.35rem" }}>
                      Todos os alunos da {tripType === "ida" ? "Ida" : "Volta"} já embarcaram!
                    </h3>
                    <p style={{ fontSize: "0.85rem", margin: "0 0 1.25rem" }}>
                      {boardedStudents.length > 0
                        ? `Todos os ${boardedStudents.length} passageiro(s) previstos já estão a bordo.`
                        : "Nenhum aluno previsto para este trajeto hoje."}
                    </p>
                    {boardedStudents.length > 0 && (
                      <Button
                        variant="secondary"
                        onClick={() => setIsFinishTripModalOpen(true)}
                        style={{ width: "auto", display: "inline-flex", alignItems: "center", gap: "0.4rem" }}
                      >
                        <FontAwesomeIcon icon={faFlagCheckered} />
                        <span>Finalizar Viagem de {tripType === "ida" ? "Ida" : "Volta"}</span>
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="item-list">
                    {pendingStudents.map((student) => {
                      const isCheckingThis = checkingInId === student.id;
                      return (
                        <div key={student.id} className="list-item">
                          <Avatar name={student.name} photoUrl={student.photoUrl ?? undefined} />

                          <div className="list-item-info">
                            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap" }}>
                              <span className="list-item-title">{student.name}</span>
                              {getTodayStatusBadge(student.todayStatus)}
                            </div>
                            <span className="list-item-sub" style={{ marginTop: "0.2rem" }}>
                              {student.email}
                            </span>
                          </div>

                          <div className="list-item-actions">
                            <button
                              type="button"
                              className="btn-check-circle"
                              onClick={() => handleManualCheckIn(student.id)}
                              disabled={isCheckingThis}
                              title="Clique para confirmar que o passageiro embarcou"
                            >
                              {isCheckingThis ? "..." : "○"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* 2. ABA: EMBARCADOS (Alunos ativos do trajeto atual que já foram buscados) */}
            {activeTab === "embarcados" && (
              <>
                {boardedStudents.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--text-muted)" }}>
                    <div style={{ fontSize: "2.2rem", marginBottom: "0.5rem", color: "var(--primary)" }}>
                      <FontAwesomeIcon icon={faVanShuttle} />
                    </div>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-main)", margin: "0 0 0.35rem" }}>
                      Nenhum aluno embarcado ainda
                    </h3>
                    <p style={{ fontSize: "0.85rem", margin: "0 0 1.25rem" }}>
                      Marque os alunos na aba &quot;A Embarcar&quot; conforme eles entrarem na van.
                    </p>
                    <Button
                      variant="secondary"
                      onClick={() => setActiveTab("a_embarcar")}
                      style={{ width: "auto", display: "inline-flex" }}
                    >
                      Ir para &quot;A Embarcar&quot;
                    </Button>
                  </div>
                ) : (
                  <div className="item-list">
                    {boardedStudents.map((student) => {
                      const isCheckingThis = checkingInId === student.id;
                      return (
                        <div key={student.id} className="list-item">
                          <Avatar name={student.name} photoUrl={student.photoUrl ?? undefined} />

                          <div className="list-item-info">
                            <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap" }}>
                              <span className="list-item-title">{student.name}</span>
                              <Badge variant="success" style={{ fontSize: "0.68rem" }}>
                                <FontAwesomeIcon icon={faCheck} style={{ marginRight: "0.25rem" }} />
                                A Bordo
                              </Badge>
                            </div>
                            <span className="list-item-sub" style={{ marginTop: "0.2rem" }}>
                              {student.email}
                            </span>
                          </div>

                          <div className="list-item-actions">
                            <button
                              type="button"
                              className="btn-check-circle checked"
                              onClick={() => handleUndoCheckIn(student.id)}
                              disabled={isCheckingThis}
                              title="Embarcado! Clique para desfazer"
                            >
                              {isCheckingThis ? "..." : <FontAwesomeIcon icon={faCheck} />}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* 3. ABA: TODOS OS ALUNOS (Cadastro geral: ativos e inativos, sem verificação de viagem do dia) */}
            {activeTab === "todos" && (
              <>
                {/* Pílulas de filtro Modernas Ativos / Inativos */}
                <div className="filter-pills" style={{ marginBottom: "1rem" }}>
                  <button
                    type="button"
                    className={`filter-pill ${allStudentsSubTab === "active" ? "active-success" : ""}`}
                    onClick={() => setAllStudentsSubTab("active")}
                  >
                    <span>
                      <FontAwesomeIcon icon={faUsers} style={{ marginRight: "0.35rem" }} />
                      Ativos ({activeStudents.length})
                    </span>
                  </button>
                  <button
                    type="button"
                    className={`filter-pill ${allStudentsSubTab === "inactive" ? "active-danger" : ""}`}
                    onClick={() => setAllStudentsSubTab("inactive")}
                  >
                    <span>
                      <FontAwesomeIcon icon={faShieldHalved} style={{ marginRight: "0.35rem" }} />
                      Inativos ({inactiveStudents.length})
                    </span>
                  </button>
                </div>

                {/* Sub-Aba: ALUNOS ATIVOS */}
                {allStudentsSubTab === "active" && (
                  <>
                    {activeStudents.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "2rem 1rem", color: "var(--text-muted)" }}>
                        <p style={{ marginBottom: "1rem" }}>Nenhum aluno ativo na sua van no momento.</p>
                        <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
                          Cadastrar Primeiro Aluno
                        </Button>
                      </div>
                    ) : (
                      <div className="item-list">
                        {activeStudents.map((student) => {
                          const payment = paymentStatuses[student.id];
                          const isPaid = payment ? Boolean(payment.paidAt) : null;
                          const isAwaitingConfirmation = payment ? (!isPaid && Boolean(payment.paymentRequestedAt)) : false;

                          return (
                            <div key={student.id} className="list-item">
                              <Avatar name={student.name} photoUrl={student.photoUrl ?? undefined} />

                              <div className="list-item-info">
                                <span className="list-item-title">{student.name}</span>

                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.2rem" }}>
                                  <span className="list-item-sub">{student.email}</span>

                                  {/* Status de Mensalidade */}
                                  {payment && (
                                    isPaid ? (
                                      <Badge variant="success" style={{ fontSize: "0.68rem" }}>
                                        Pago
                                      </Badge>
                                    ) : isAwaitingConfirmation ? (
                                      <div style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", flexWrap: "wrap" }}>
                                        <Badge variant="warning" style={{ fontSize: "0.68rem" }}>
                                          <FontAwesomeIcon icon={faHourglassHalf} style={{ marginRight: "0.25rem" }} />
                                          Confirmar Pgto
                                        </Badge>
                                        <button
                                          type="button"
                                          onClick={() => handleConfirmPayment(student.id)}
                                          disabled={markingPaidId === student.id || rejectingPaymentId === student.id}
                                          style={{
                                            background: "var(--success, #22c55e)",
                                            border: "none",
                                            color: "#fff",
                                            fontSize: "0.72rem",
                                            fontWeight: 700,
                                            cursor: "pointer",
                                            padding: "0.18rem 0.45rem",
                                            borderRadius: "4px",
                                            minHeight: "auto",
                                            width: "auto",
                                            display: "inline-flex",
                                            alignItems: "center",
                                            gap: "0.25rem",
                                          }}
                                        >
                                          {markingPaidId === student.id ? "..." : (
                                            <>
                                              <FontAwesomeIcon icon={faCheck} />
                                              <span>Confirmar</span>
                                            </>
                                          )}
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleRejectPayment(student.id)}
                                          disabled={markingPaidId === student.id || rejectingPaymentId === student.id}
                                          style={{
                                            background: "transparent",
                                            border: "none",
                                            color: "var(--danger, #ef4444)",
                                            fontSize: "0.72rem",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                            padding: 0,
                                            minHeight: "auto",
                                            width: "auto",
                                            textDecoration: "underline",
                                          }}
                                          title="Recusar confirmação"
                                        >
                                          {rejectingPaymentId === student.id ? "..." : "Recusar"}
                                        </button>
                                      </div>
                                    ) : (
                                      <div style={{ display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                                        <Badge variant="danger" style={{ fontSize: "0.68rem" }}>
                                          Pendente
                                        </Badge>
                                        <button
                                          type="button"
                                          onClick={() => handleConfirmPayment(student.id)}
                                          disabled={markingPaidId === student.id}
                                          style={{
                                            background: "transparent",
                                            border: "none",
                                            color: "var(--primary)",
                                            fontSize: "0.75rem",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                            padding: 0,
                                            minHeight: "auto",
                                            width: "auto",
                                            textDecoration: "underline",
                                          }}
                                        >
                                          {markingPaidId === student.id ? "..." : "Dar Baixa"}
                                        </button>
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>

                              <div className="list-item-actions">
                                <button
                                  type="button"
                                  onClick={() => setStudentToDeactivate(student)}
                                  title="Desativar aluno da van"
                                  style={{
                                    background: "transparent",
                                    border: "none",
                                    color: "var(--text-light)",
                                    cursor: "pointer",
                                    fontSize: "1rem",
                                    padding: "0.3rem",
                                    minHeight: "auto",
                                    width: "auto",
                                    borderRadius: "6px",
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--danger)")}
                                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-light)")}
                                >
                                  <FontAwesomeIcon icon={faTrashCan} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}

                {/* Sub-Aba: ALUNOS INATIVOS (Com ação rápida de reativação) */}
                {allStudentsSubTab === "inactive" && (
                  <>
                    {inactiveStudents.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "2.5rem 1rem", color: "var(--text-muted)" }}>
                        <div style={{ fontSize: "2.2rem", marginBottom: "0.5rem", color: "var(--text-muted)" }}>
                          <FontAwesomeIcon icon={faShieldHalved} />
                        </div>
                        <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--text-main)", margin: "0 0 0.35rem" }}>
                          Nenhum aluno inativo
                        </h3>
                        <p style={{ fontSize: "0.85rem", margin: 0 }}>
                          Todos os alunos cadastrados estão ativos e participando das viagens.
                        </p>
                      </div>
                    ) : (
                      <div className="item-list">
                        {inactiveStudents.map((student) => {
                          const isReactivatingThis = reactivatingId === student.id;
                          return (
                            <div
                              key={student.id}
                              className="list-item"
                              style={{
                                background: "var(--bg-input)",
                                opacity: 0.92,
                              }}
                            >
                              <Avatar name={student.name} photoUrl={student.photoUrl ?? undefined} />

                              <div className="list-item-info">
                                <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap" }}>
                                  <span className="list-item-title" style={{ color: "var(--text-muted)" }}>
                                    {student.name}
                                  </span>
                                  <Badge variant="neutral" style={{ fontSize: "0.68rem" }}>
                                    Inativo
                                  </Badge>
                                </div>
                                <span className="list-item-sub" style={{ marginTop: "0.2rem" }}>
                                  {student.email}
                                </span>
                              </div>

                              <div className="list-item-actions">
                                <Button
                                  variant="secondary"
                                  onClick={() => handleReactivateStudent(student)}
                                  disabled={isReactivatingThis}
                                  style={{
                                    width: "auto",
                                    minHeight: "34px",
                                    padding: "0.3rem 0.85rem",
                                    fontSize: "0.8rem",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "0.35rem",
                                    fontWeight: 600,
                                  }}
                                >
                                  {isReactivatingThis ? (
                                    "Reativando..."
                                  ) : (
                                    <>
                                      <FontAwesomeIcon icon={faRotateRight} />
                                      <span>Reativar Aluno</span>
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </>
        )}
      </Card>

      {/* Modal de Finalizar Viagem */}
      <Modal
        isOpen={isFinishTripModalOpen}
        onClose={() => setIsFinishTripModalOpen(false)}
        title={`Finalizar Viagem de ${tripType === "ida" ? "Ida" : "Volta"}`}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <p style={{ margin: 0, lineHeight: 1.5, color: "var(--text-main)" }}>
            Deseja finalizar a viagem de <strong>{tripType === "ida" ? "Ida" : "Volta"}</strong>?
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
            • A lista alternará automaticamente para o trajeto de <strong>{tripType === "ida" ? "Volta" : "Ida"}</strong>.<br />
            • A lista de embarcados será esvaziada e todos os alunos ativos ficarão prontos para o novo embarque.
          </div>

          <div className="button-group" style={{ margin: "0.5rem 0 0" }}>
            <Button
              variant="primary"
              onClick={handleConfirmFinishTrip}
              isLoading={finishingTrip}
            >
              Sim, Finalizar e Iniciar {tripType === "ida" ? "Volta" : "Ida"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsFinishTripModalOpen(false)}
              disabled={finishingTrip}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal de Cadastro de Aluno */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Cadastrar Novo Aluno"
      >
        <form onSubmit={handleCreateStudent}>
          <Input
            label="Nome Completo"
            placeholder="Ex: João da Silva"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <Input
            label="E-mail"
            type="email"
            placeholder="joao@faculdade.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Input
            label="Senha Provisória"
            type="password"
            placeholder="Mínimo 6 caracteres"
            value={temporaryPassword}
            onChange={(e) => setTemporaryPassword(e.target.value)}
            required
          />

          {error && (
            <div style={{ color: "var(--danger)", fontSize: "0.85rem", marginBottom: "0.75rem" }}>
              {error}
            </div>
          )}

          <div className="button-group" style={{ margin: "1rem 0 0" }}>
            <Button type="submit" variant="primary" isLoading={submitting}>
              Cadastrar Aluno
            </Button>
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal de Confirmação de Desativação */}
      <Modal
        isOpen={Boolean(studentToDeactivate)}
        onClose={() => setStudentToDeactivate(null)}
        title="Desativar Aluno da Van"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <p style={{ margin: 0, lineHeight: 1.5, color: "var(--text-main)" }}>
            Deseja realmente desativar <strong>{studentToDeactivate?.name}</strong> da sua van?
          </p>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.85rem" }}>
            O aluno será movido para a lista de <strong>Inativos</strong> e deixará de constar nas listas de presença diária e contagem de faltantes. Você poderá reativá-lo a qualquer momento.
          </p>
          <div className="button-group" style={{ margin: "0.5rem 0 0" }}>
            <Button
              variant="danger"
              onClick={handleConfirmDeactivate}
              isLoading={deactivating}
            >
              Confirmar Desativação
            </Button>
            <Button
              variant="ghost"
              onClick={() => setStudentToDeactivate(null)}
              disabled={deactivating}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
