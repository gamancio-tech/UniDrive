import { useState, useMemo } from "react";
import { TripStep } from "../../../dailyStatus/useDailyStatus";
import { parseTripType, TripType } from "../../../../utils/trip";
import { STORAGE_KEYS, getStorage, setStorage } from "../../../../utils/storage";
import { useDriverStudents } from "./useDriverStudents";
import { useStudentPayments } from "./useStudentPayments";
import { useTripActions } from "./useTripActions";
import { useRowAction } from "./useRowAction";
import { useBoardingActions } from "./useBoardingActions";
import { useStudentLifecycle } from "./useStudentLifecycle";
import { useTripStudents } from "./useTripStudents";

export type StudentTab = "a_embarcar" | "embarcados" | "todos";

export interface DriverStudentListProps {
  tripType?: TripType;
  tripStep?: TripStep;
  activeClassId?: string;
  activeClassName?: string;
  onTripChange?: (trip: TripType) => void;
  onTripFinished?: () => void;
  onUpdateTripState?: (trip: TripType, step: TripStep) => Promise<void>;
}

export function useDriverStudentList({
  tripType: controlledTripType,
  tripStep,
  activeClassId,
  activeClassName,
  onTripChange,
  onTripFinished,
  onUpdateTripState,
}: DriverStudentListProps) {
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

  const rowAction = useRowAction();
  const [activeTab, setActiveTab] = useState<StudentTab>("a_embarcar");
  const [internalTripType, setInternalTripType] = useState<TripType>(() =>
    parseTripType(getStorage(STORAGE_KEYS.driverTripType))
  );
  const tripType = controlledTripType ?? internalTripType;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isFinishTripModalOpen, setIsFinishTripModalOpen] = useState(false);

  const {
    paymentStatuses,
    markingPaidId,
    rejectingPaymentId,
    handleConfirmPayment,
    handleRejectPayment,
  } = useStudentPayments(activeStudents, rowAction);

  const {
    pendingStudents,
    boardedStudents,
    filteredActiveStudents,
    filteredInactiveStudents,
  } = useTripStudents({ dailyStudents, activeStudents, inactiveStudents, tripType, activeClassId });

  const handleSelectTrip = (type: TripType) => {
    if (onTripChange) {
      onTripChange(type);
    } else {
      setInternalTripType(type);
      setStorage(STORAGE_KEYS.driverTripType, type);
    }
  };

  const { finishingTrip, handleConfirmFinishTrip, handleDeclareDeparture } = useTripActions({
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

  const { handleManualCheckIn, handleUndoCheckIn } = useBoardingActions({
    setDailyStudents,
    rowAction,
  });

  const {
    studentToDeactivate,
    setStudentToDeactivate,
    handleConfirmDeactivate,
    handleReactivateStudent,
  } = useStudentLifecycle({
    setActiveStudents,
    setInactiveStudents,
    setDailyStudents,
    loadStudents,
    rowAction,
  });

  const checkingInId = rowAction.activeAction === "checkIn" ? rowAction.activeId : null;
  const reactivatingId = rowAction.activeAction === "reactivate" ? rowAction.activeId : null;
  const deactivating = Boolean(
    studentToDeactivate && rowAction.isBusy(studentToDeactivate.id, "deactivate")
  );

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

  return {
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
  };
}
