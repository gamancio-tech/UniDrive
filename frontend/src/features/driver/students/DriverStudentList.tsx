import React from "react";
import { Card } from "../../../components/Card";
import { Button } from "../../../components/Button";
import { Tabs } from "../../../components/Tabs";
import { useDriverStudentList, DriverStudentListProps } from "./hooks/useDriverStudentList";
import { BoardingList } from "./components/BoardingList";
import { TripControlBar } from "./components/TripControlBar";
import { RegisteredStudentsPanel } from "./components/RegisteredStudentsPanel";
import { AddStudentModal } from "./components/AddStudentModal";
import { FinishTripModal } from "./components/FinishTripModal";
import { DeactivateStudentModal } from "./components/DeactivateStudentModal";

export type { DriverStudentListProps };

export const DriverStudentList: React.FC<DriverStudentListProps> = (props) => {
  const {
    activeTab,
    setActiveTab,
    tripType,
    cardSubtitle,
    loading,
    pendingStudents,
    boardedStudents,
    filteredActiveStudents,
    filteredInactiveStudents,
    paymentStatuses,
    checkingInId,
    markingPaidId,
    rejectingPaymentId,
    reactivatingId,
    finishingTrip,
    handleSelectTrip,
    handleDeclareDeparture,
    handleConfirmFinishTrip,
    handleManualCheckIn,
    handleUndoCheckIn,
    handleConfirmPayment,
    handleRejectPayment,
    handleConfirmDeactivate,
    handleReactivateStudent,
    isModalOpen,
    setIsModalOpen,
    isFinishTripModalOpen,
    setIsFinishTripModalOpen,
    studentToDeactivate,
    setStudentToDeactivate,
    deactivating,
    availableClasses,
    loadStudents,
    activeClassId,
    activeClassName,
    tripStep,
  } = useDriverStudentList(props);

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
        <TripControlBar
          tripType={tripType}
          tripStep={tripStep}
          finishingTrip={finishingTrip}
          onSelectTrip={handleSelectTrip}
          onDeclareDeparture={handleDeclareDeparture}
          onFinishTripModalOpen={() => setIsFinishTripModalOpen(true)}
        />

        <Tabs
          tabs={[
            { id: "a_embarcar", label: "A Embarcar", count: pendingStudents.length },
            { id: "embarcados", label: "Embarcados", count: boardedStudents.length },
            { id: "todos", label: "Todos", count: filteredActiveStudents.length + filteredInactiveStudents.length },
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        {loading ? (
          <p style={{ textAlign: "center", color: "var(--text-muted)", padding: "1.5rem 0" }}>
            Carregando passageiros...
          </p>
        ) : activeTab !== "todos" ? (
          <BoardingList
            variant={activeTab === "a_embarcar" ? "pending" : "boarded"}
            students={activeTab === "a_embarcar" ? pendingStudents : boardedStudents}
            tripType={tripType}
            boardedCount={boardedStudents.length}
            checkingInId={checkingInId}
            onToggleCheckIn={activeTab === "a_embarcar" ? handleManualCheckIn : handleUndoCheckIn}
            onFinishTripModalOpen={() => setIsFinishTripModalOpen(true)}
            onNavigateToPending={() => setActiveTab("a_embarcar")}
          />
        ) : (
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
      </Card>

      <FinishTripModal
        isOpen={isFinishTripModalOpen}
        onClose={() => setIsFinishTripModalOpen(false)}
        tripType={tripType}
        loading={finishingTrip}
        onConfirm={handleConfirmFinishTrip}
      />

      <AddStudentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        activeClassId={activeClassId}
        availableClasses={availableClasses}
        onStudentCreated={loadStudents}
      />

      <DeactivateStudentModal
        student={studentToDeactivate}
        onClose={() => setStudentToDeactivate(null)}
        loading={deactivating}
        onConfirm={handleConfirmDeactivate}
      />
    </>
  );
};
