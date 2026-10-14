import React, { useState, useMemo } from "react";
import { apiRequest } from "../../../api/client";
import { Card } from "../../../components/Card";
import { Button } from "../../../components/Button";
import { useToast } from "../../../components/Toast";
import { Tabs } from "../../../components/Tabs";
import {
  deactivateDriverStudent,
  reactivateDriverStudent,
  RegisteredStudent,
} from "../../../api/students";
import { TripStep } from "../../dailyStatus/useDailyStatus";
import { filterStudentsForTrip, parseTripType, TripType } from "../../../utils/trip";
import { STORAGE_KEYS, getStorage, setStorage } from "../../../utils/storage";
import { useDriverStudents } from "./hooks/useDriverStudents";
import { useStudentPayments } from "./hooks/useStudentPayments";
import { useTripActions } from "./hooks/useTripActions";
import { BoardingList } from "./components/BoardingList";
import { TripControlBar } from "./components/TripControlBar";
import { RegisteredStudentsPanel } from "./components/RegisteredStudentsPanel";
import { AddStudentModal } from "./components/AddStudentModal";
import { FinishTripModal } from "./components/FinishTripModal";
import { DeactivateStudentModal } from "./components/DeactivateStudentModal";

type StudentTab = "a_embarcar" | "embarcados" | "todos";

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

  const [internalTripType, setInternalTripType] = useState<TripType>(() =>
    parseTripType(getStorage(STORAGE_KEYS.driverTripType))
  );

  const tripType = controlledTripType ?? internalTripType;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFinishTripModalOpen, setIsFinishTripModalOpen] = useState(false);
  const [checkingInId, setCheckingInId] = useState<string | null>(null);
  const [studentToDeactivate, setStudentToDeactivate] = useState<RegisteredStudent | null>(null);
  const [deactivating, setDeactivating] = useState(false);
  const [reactivatingId, setReactivatingId] = useState<string | null>(null);

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

  const {
    finishingTrip,
    handleConfirmFinishTrip,
    handleDeclareDeparture,
  } = useTripActions({
    tripType,
    activeClassId,
    onUpdateTripState,
    onSelectTrip: handleSelectTrip,
    onTripFinished,
    setDailyStudents,
    onSuccessFinish: () => {
      setActiveTab("a_embarcar");
      setIsFinishTripModalOpen(false);
    },
  });



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
              onClick={() => setIsModalOpen(true)}
              style={{ width: "auto", minHeight: "38px", padding: "0.4rem 0.95rem", fontSize: "0.85rem" }}
            >
              + Novo Aluno
            </Button>
          ) : undefined
        }
      >
        {/* Painel de Controle de Trajeto (Ida / Volta / Finalizar Viagem) */}
        <TripControlBar
          tripType={tripType}
          tripStep={tripStep}
          finishingTrip={finishingTrip}
          onSelectTrip={handleSelectTrip}
          onDeclareDeparture={handleDeclareDeparture}
          onFinishTripModalOpen={() => setIsFinishTripModalOpen(true)}
        />

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
              <BoardingList
                variant="pending"
                students={pendingStudents}
                tripType={tripType}
                boardedCount={boardedStudents.length}
                checkingInId={checkingInId}
                onToggleCheckIn={handleManualCheckIn}
                onFinishTripModalOpen={() => setIsFinishTripModalOpen(true)}
                onNavigateToPending={() => setActiveTab("a_embarcar")}
              />
            )}

            {/* 2. ABA: EMBARCADOS (Alunos ativos do trajeto atual que já foram buscados) */}
            {activeTab === "embarcados" && (
              <BoardingList
                variant="boarded"
                students={boardedStudents}
                tripType={tripType}
                boardedCount={boardedStudents.length}
                checkingInId={checkingInId}
                onToggleCheckIn={handleUndoCheckIn}
                onFinishTripModalOpen={() => setIsFinishTripModalOpen(true)}
                onNavigateToPending={() => setActiveTab("a_embarcar")}
              />
            )}

            {/* 3. ABA: TODOS OS ALUNOS (Cadastro geral: ativos e inativos, sem verificação de viagem do dia) */}
            {activeTab === "todos" && (
              <RegisteredStudentsPanel
                activeStudents={filteredActiveStudents}
                inactiveStudents={filteredInactiveStudents}
                paymentStatuses={paymentStatuses}
                markingPaidId={markingPaidId}
                rejectingPaymentId={rejectingPaymentId}
                reactivatingId={reactivatingId}
                onOpenAddModal={() => setIsModalOpen(true)}
                onConfirmPayment={handleConfirmPayment}
                onRejectPayment={handleRejectPayment}
                onSelectStudentToDeactivate={setStudentToDeactivate}
                onReactivateStudent={handleReactivateStudent}
              />
            )}
          </>
        )}
      </Card>

      {/* Modal de Finalizar Viagem */}
      <FinishTripModal
        isOpen={isFinishTripModalOpen}
        onClose={() => setIsFinishTripModalOpen(false)}
        tripType={tripType}
        loading={finishingTrip}
        onConfirm={handleConfirmFinishTrip}
      />

      {/* Modal de Cadastro de Aluno */}
      <AddStudentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        activeClassId={activeClassId}
        availableClasses={availableClasses}
        onStudentCreated={loadStudents}
      />

      {/* Modal de Confirmação de Desativação */}
      <DeactivateStudentModal
        student={studentToDeactivate}
        onClose={() => setStudentToDeactivate(null)}
        loading={deactivating}
        onConfirm={handleConfirmDeactivate}
      />
    </>
  );
};
