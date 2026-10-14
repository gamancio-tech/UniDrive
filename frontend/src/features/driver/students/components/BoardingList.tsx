import React from "react";
import { DriverStudent } from "../../../../api/students";
import { TripType } from "../../../../utils/trip";
import { Button } from "../../../../components/Button";
import { EmptyState } from "../../../../components/EmptyState";
import { StudentRow } from "./StudentRow";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faCircleCheck,
  faFlagCheckered,
  faVanShuttle,
} from "@fortawesome/free-solid-svg-icons";

export interface BoardingListProps {
  variant: "pending" | "boarded";
  students: DriverStudent[];
  tripType: TripType;
  boardedCount: number;
  checkingInId: string | null;
  onToggleCheckIn: (studentId: string) => void;
  onFinishTripModalOpen: () => void;
  onNavigateToPending: () => void;
}

export const BoardingList: React.FC<BoardingListProps> = ({
  variant,
  students,
  tripType,
  boardedCount,
  checkingInId,
  onToggleCheckIn,
  onFinishTripModalOpen,
  onNavigateToPending,
}) => {
  const isPending = variant === "pending";
  const tripLabel = tripType === "ida" ? "Ida" : "Volta";

  if (students.length === 0) {
    if (isPending) {
      return (
        <EmptyState
          icon={faCircleCheck}
          iconColor="var(--success, #22c55e)"
          title={`Todos os alunos da ${tripLabel} já embarcaram!`}
          description={
            boardedCount > 0
              ? `Todos os ${boardedCount} passageiro(s) previstos já estão a bordo.`
              : "Nenhum aluno previsto para este trajeto hoje."
          }
          action={
            boardedCount > 0 ? (
              <Button
                variant="secondary"
                onClick={onFinishTripModalOpen}
                className="btn-compact"
              >
                <FontAwesomeIcon icon={faFlagCheckered} />
                <span>Finalizar Viagem de {tripLabel}</span>
              </Button>
            ) : undefined
          }
        />
      );
    }

    return (
      <EmptyState
        icon={faVanShuttle}
        iconColor="var(--primary)"
        title="Nenhum aluno embarcado ainda"
        description='Marque os alunos na aba "A Embarcar" conforme eles entrarem na van.'
        action={
          <Button
            variant="secondary"
            onClick={onNavigateToPending}
            className="btn-compact"
          >
            Ir para &quot;A Embarcar&quot;
          </Button>
        }
      />
    );
  }

  return (
    <div className="item-list">
      {students.map((student) => (
        <StudentRow
          key={student.id}
          student={student}
          variant={variant}
          isChecking={checkingInId === student.id}
          onToggleCheckIn={onToggleCheckIn}
        />
      ))}
    </div>
  );
};
