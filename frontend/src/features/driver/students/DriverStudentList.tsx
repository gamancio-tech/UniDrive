import React, { useState, useEffect, useMemo } from "react";
import { apiRequest } from "../../../api/client";
import { Card } from "../../../components/Card";
import { Button } from "../../../components/Button";
import { Input } from "../../../components/Input";
import { Modal } from "../../../components/Modal";
import { Badge } from "../../../components/Badge";
import { Avatar } from "../../../components/Avatar";
import { useToast } from "../../../components/Toast";
import { EmptyState } from "../../../components/EmptyState";
import { ConfirmModal } from "../../../components/ConfirmModal";
import { FilterPills } from "../../../components/FilterPills";
import { Tabs } from "../../../components/Tabs";
import {
  deactivateDriverStudent,
  reactivateDriverStudent,
  resetAllDailyBoarded,
  RegisteredStudent,
} from "../../../api/students";
import { TripStep } from "../../dailyStatus/useDailyStatus";
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
  faTrashCan,
  faRotateRight,
  faGraduationCap,
  faRocket,
} from "@fortawesome/free-solid-svg-icons";
import { filterStudentsForTrip, parseTripType, TripType } from "../../../utils/trip";
import { STORAGE_KEYS, getStorage, setStorage } from "../../../utils/storage";
import { useDriverStudents } from "./hooks/useDriverStudents";
import { useStudentPayments } from "./hooks/useStudentPayments";
import { PaymentBadge } from "./components/PaymentBadge";

type StudentTab = "a_embarcar" | "embarcados" | "todos";
type StudentStatusSubTab = "active" | "inactive";

export interface DriverStudentListProps {
  tripType?: TripType;
  tripStep?: TripStep;
  activeClassId?: string;
  activeClassName?: string;
  onTripChange?: (trip: TripType) => void;
  onTripFinished?: () => void;
  onUpdateTripState?: (trip: TripType, step: TripStep) => Promise<void>;
}

export const DriverStudentList: React.FC<DriverStudentListProps> = ({
  tripType: controlledTripType,
  tripStep,
  activeClassId,
  activeClassName,
  onTripChange,
  onTripFinished,
  onUpdateTripState,
}) => {
  const { showToast } = useToast();
  const {
    dailyStudents,
    activeStudents,
    inactiveStudents,
    availableClasses,
    loading,
    loadStudents,
    setDailyStudents,
    setActiveStudents,
    setInactiveStudents,
  } = useDriverStudents(activeClassId);

  const {
    paymentStatuses,
    markingPaidId,
    rejectingPaymentId,
    handleConfirmPayment,
    handleRejectPayment,
  } = useStudentPayments(activeStudents);

  const [activeTab, setActiveTab] = useState<StudentTab>("a_embarcar");
  const [allStudentsSubTab, setAllStudentsSubTab] = useState<StudentStatusSubTab>("active");

  const [internalTripType, setInternalTripType] = useState<TripType>(() =>
    parseTripType(getStorage(STORAGE_KEYS.driverTripType))
  );

  const tripType = controlledTripType ?? internalTripType;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFinishTripModalOpen, setIsFinishTripModalOpen] = useState(false);
  const [finishingTrip, setFinishingTrip] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const [studentToDeactivate, setStudentToDeactivate] = useState<RegisteredStudent | null>(null);
  const [deactivating, setDeactivating] = useState(false);
  const [reactivatingId, setReactivatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [targetClassId, setTargetClassId] = useState<string>("");

  // Sincroniza a turma padrão quando o modal de cadastro é aberto
  useEffect(() => {
    if (isModalOpen) {
      setError(null);
      setTargetClassId((prev) => prev || activeClassId || availableClasses[0]?.id || "");
    }
  }, [isModalOpen, activeClassId, availableClasses]);

  // Alunos que participam do trajeto atual (apenas ativos, filtrados pela turma ativa se selecionada)
  const tripFilteredStudents = useMemo(
    () => filterStudentsForTrip(dailyStudents, tripType, activeClassId),
    [dailyStudents, tripType, activeClassId]
  );

  // Lista 1: Alunos que vão mas ainda não embarcaram
  const pendingStudents = useMemo(() => {
    return tripFilteredStudents.filter((s) => !s.isBoarded);
  }, [tripFilteredStudents]);

  // Lista 2: Alunos da viagem atual que já foram buscados / embarcados
  const boardedStudents = useMemo(() => {
    return tripFilteredStudents.filter((s) => Boolean(s.isBoarded));
  }, [tripFilteredStudents]);

  // Alunos cadastrados filtrados pela turma ativa
  const filteredActiveStudents = useMemo(() => {
    if (!activeClassId) return activeStudents;
    return activeStudents.filter((s) => !s.classId || s.classId === activeClassId);
  }, [activeStudents, activeClassId]);

  const filteredInactiveStudents = useMemo(() => {
    if (!activeClassId) return inactiveStudents;
    return inactiveStudents.filter((s) => !s.classId || s.classId === activeClassId);
  }, [inactiveStudents, activeClassId]);

  const handleSelectTrip = (type: TripType) => {
    if (onTripChange) {
      onTripChange(type);
    } else {
      setInternalTripType(type);
      setStorage(STORAGE_KEYS.driverTripType, type);
    }
  };

  const handleConfirmFinishTrip = async () => {
    try {
      setFinishingTrip(true);
      await resetAllDailyBoarded(activeClassId);

      // Alterna o trajeto entre Ida e Volta
      const nextTrip: TripType = tripType === "ida" ? "volta" : "ida";

      // Sincroniza o estado da viagem com o backend
      if (onUpdateTripState) {
        await onUpdateTripState(nextTrip, "aguardando");
      } else {
        await apiRequest("/daily-status/trip-state", {
          method: "POST",
          body: { trip: nextTrip, step: "aguardando", classId: activeClassId || undefined },
        });
      }

      // Zera localmente o embarque de todos os alunos do trajeto diário
      setDailyStudents((prev) => prev.map((s) => ({ ...s, isBoarded: false })));

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

  const handleDeclareDeparture = async () => {
    try {
      setFinishingTrip(true);
      if (onUpdateTripState) {
        await onUpdateTripState("volta", "em_viagem");
      } else {
        await apiRequest("/daily-status/trip-state", {
          method: "POST",
          body: { trip: "volta", step: "em_viagem", classId: activeClassId || undefined },
        });
      }
      onTripFinished?.();
      showToast("Viagem de volta iniciada! A contagem de faltantes foi encerrada para os alunos.", "success");
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Erro ao declarar partida.", "error");
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

    if (temporaryPassword.length < 8) {
      setError("A senha provisória deve ter no mínimo 8 caracteres.");
      return;
    }

    setSubmitting(true);
    try {
      const classToAssign = targetClassId || activeClassId || availableClasses[0]?.id;
      if (!classToAssign) {
        throw new Error("Selecione uma turma para vincular o aluno.");
      }
      await apiRequest("/students", {
        method: "POST",
        body: {
          name: name.trim(),
          email: email.trim().toLowerCase(),
          temporaryPassword,
          classId: classToAssign,
        },
      });
      setIsModalOpen(false);
      setName("");
      setEmail("");
      setTemporaryPassword("");
      setTargetClassId("");
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
    return `${filteredActiveStudents.length} ativo(s) • ${filteredInactiveStudents.length} inativo(s)`;
  }, [
    activeTab,
    pendingStudents.length,
    boardedStudents.length,
    filteredActiveStudents.length,
    filteredInactiveStudents.length,
    tripType,
  ]);

  return (
    <>
      <Card
        title={activeClassName ? `Alunos — ${activeClassName}` : "Meus Alunos"}
        subtitle={cardSubtitle}
        action={
          activeTab === "todos" ? (
            <Button
              variant="primary"
              onClick={() => {
                setTargetClassId(activeClassId || availableClasses[0]?.id || "");
                setIsModalOpen(true);
              }}
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
          <div className="row-wrap" style={{ gap: "0.45rem" }}>
            <span style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: 600 }}>
              Trajeto:
            </span>
            <FilterPills
              options={[
                { value: "ida", label: "Ida", icon: faSun },
                { value: "volta", label: "Volta", icon: faMoon },
              ]}
              value={tripType}
              onChange={handleSelectTrip}
              style={{ marginBottom: 0 }}
            />
          </div>

          <div style={{ display: "flex", gap: "0.45rem", alignItems: "center", flexWrap: "wrap" }}>
            {tripType === "volta" && tripStep === "aguardando" && (
              <Button
                variant="primary"
                onClick={handleDeclareDeparture}
                disabled={finishingTrip}
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
                <FontAwesomeIcon icon={faRocket} />
                <span>Declarar Partida (Volta)</span>
              </Button>
            )}

            <Button
              variant={tripType === "volta" && tripStep === "aguardando" ? "ghost" : "primary"}
              onClick={() => setIsFinishTripModalOpen(true)}
              disabled={finishingTrip}
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
        </div>

        {/* Abas de Navegação entre as 3 Listas */}
        <Tabs
          tabs={[
            { id: "a_embarcar", label: "A Embarcar", count: pendingStudents.length },
            { id: "embarcados", label: "Embarcados", count: boardedStudents.length },
            { id: "todos", label: "Todos", count: activeStudents.length + inactiveStudents.length },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

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
                  <EmptyState
                    icon={faCircleCheck}
                    iconColor="var(--success, #22c55e)"
                    title={`Todos os alunos da ${tripType === "ida" ? "Ida" : "Volta"} já embarcaram!`}
                    description={
                      boardedStudents.length > 0
                        ? `Todos os ${boardedStudents.length} passageiro(s) previstos já estão a bordo.`
                        : "Nenhum aluno previsto para este trajeto hoje."
                    }
                    action={
                      boardedStudents.length > 0 ? (
                        <Button
                          variant="secondary"
                          onClick={() => setIsFinishTripModalOpen(true)}
                          className="btn-compact"
                        >
                          <FontAwesomeIcon icon={faFlagCheckered} />
                          <span>Finalizar Viagem de {tripType === "ida" ? "Ida" : "Volta"}</span>
                        </Button>
                      ) : undefined
                    }
                  />
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
                  <EmptyState
                    icon={faVanShuttle}
                    iconColor="var(--primary)"
                    title="Nenhum aluno embarcado ainda"
                    description='Marque os alunos na aba "A Embarcar" conforme eles entrarem na van.'
                    action={
                      <Button
                        variant="secondary"
                        onClick={() => setActiveTab("a_embarcar")}
                        className="btn-compact"
                      >
                        Ir para &quot;A Embarcar&quot;
                      </Button>
                    }
                  />
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
                <FilterPills
                  options={[
                    { value: "active", label: "Ativos", icon: faUsers, count: filteredActiveStudents.length, variant: "success" },
                    { value: "inactive", label: "Inativos", icon: faShieldHalved, count: filteredInactiveStudents.length, variant: "danger" },
                  ]}
                  value={allStudentsSubTab}
                  onChange={setAllStudentsSubTab}
                  style={{ marginBottom: "1rem" }}
                />

                {/* Sub-Aba: ALUNOS ATIVOS */}
                {allStudentsSubTab === "active" && (
                  <>
                    {filteredActiveStudents.length === 0 ? (
                      <EmptyState
                        title="Nenhum aluno ativo"
                        description="Nenhum aluno ativo na sua van no momento."
                        action={
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setTargetClassId(activeClassId || availableClasses[0]?.id || "");
                              setIsModalOpen(true);
                            }}
                          >
                            Cadastrar Primeiro Aluno
                          </Button>
                        }
                      />
                    ) : (
                      <div className="item-list">
                        {filteredActiveStudents.map((student) => {
                          return (
                            <div key={student.id} className="list-item">
                              <Avatar name={student.name} photoUrl={student.photoUrl ?? undefined} />

                              <div className="list-item-info">
                                <span className="list-item-title">{student.name}</span>

                                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.2rem" }}>
                                  <span className="list-item-sub">{student.email}</span>

                                  {student.class?.name && (
                                    <span className="class-tag-badge">
                                      <FontAwesomeIcon icon={faGraduationCap} />
                                      {student.class.name}
                                    </span>
                                  )}

                                  {/* Status de Mensalidade */}
                                  <PaymentBadge
                                    payment={paymentStatuses[student.id]}
                                    isMarkingPaid={markingPaidId === student.id}
                                    isRejectingPayment={rejectingPaymentId === student.id}
                                    onConfirm={() => handleConfirmPayment(student.id)}
                                    onReject={() => handleRejectPayment(student.id)}
                                  />
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
                    {filteredInactiveStudents.length === 0 ? (
                      <EmptyState
                        icon={faShieldHalved}
                        title="Nenhum aluno inativo"
                        description="Todos os alunos cadastrados estão ativos e participando das viagens."
                      />
                    ) : (
                      <div className="item-list">
                        {filteredInactiveStudents.map((student) => {
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
      <ConfirmModal
        isOpen={isFinishTripModalOpen}
        onClose={() => setIsFinishTripModalOpen(false)}
        title={`Finalizar Viagem de ${tripType === "ida" ? "Ida" : "Volta"}`}
        message={
          <p style={{ margin: 0, lineHeight: 1.5, color: "var(--text-main)" }}>
            Deseja finalizar a viagem de <strong>{tripType === "ida" ? "Ida" : "Volta"}</strong>?
          </p>
        }
        confirmLabel={`Sim, Finalizar e Iniciar ${tripType === "ida" ? "Volta" : "Ida"}`}
        loading={finishingTrip}
        onConfirm={handleConfirmFinishTrip}
      >
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
      </ConfirmModal>

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
            placeholder="Mínimo 8 caracteres"
            minLength={8}
            value={temporaryPassword}
            onChange={(e) => setTemporaryPassword(e.target.value)}
            required
          />

          {availableClasses.length > 0 && (
            <div style={{ marginBottom: "1rem" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "var(--text-main)",
                  marginBottom: "0.35rem",
                }}
              >
                Turma
              </label>
              <select
                value={targetClassId || activeClassId || availableClasses[0]?.id || ""}
                onChange={(e) => setTargetClassId(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.65rem 0.85rem",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)",
                  background: "var(--bg-input)",
                  color: "var(--text-main)",
                  fontSize: "0.9rem",
                  outline: "none",
                }}
              >
                {availableClasses.map((cls) => (
                  <option key={cls.id} value={cls.id}>
                    {cls.name}
                  </option>
                ))}
              </select>
            </div>
          )}

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
      <ConfirmModal
        isOpen={Boolean(studentToDeactivate)}
        onClose={() => setStudentToDeactivate(null)}
        title="Desativar Aluno da Van"
        message={
          <>
            <p style={{ margin: 0, lineHeight: 1.5, color: "var(--text-main)" }}>
              Deseja realmente desativar <strong>{studentToDeactivate?.name}</strong> da sua van?
            </p>
            <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.85rem" }}>
              O aluno será movido para a lista de <strong>Inativos</strong> e deixará de constar nas listas de presença diária e contagem de faltantes. Você poderá reativá-lo a qualquer momento.
            </p>
          </>
        }
        confirmLabel="Confirmar Desativação"
        variant="danger"
        loading={deactivating}
        onConfirm={handleConfirmDeactivate}
      />
    </>
  );
};
