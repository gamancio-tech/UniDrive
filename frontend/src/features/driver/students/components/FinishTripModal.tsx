import React from "react";
import { ConfirmModal } from "../../../../components/ConfirmModal";
import { TripType } from "../../../../utils/trip";

export interface FinishTripModalProps {
  isOpen: boolean;
  onClose: () => void;
  tripType: TripType;
  loading: boolean;
  onConfirm: () => Promise<void> | void;
}

export const FinishTripModal: React.FC<FinishTripModalProps> = ({
  isOpen,
  onClose,
  tripType,
  loading,
  onConfirm,
}) => {
  const currentTripLabel = tripType === "ida" ? "Ida" : "Volta";
  const nextTripLabel = tripType === "ida" ? "Volta" : "Ida";

  return (
    <ConfirmModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Finalizar Viagem de ${currentTripLabel}`}
      message={
        <p style={{ margin: 0, lineHeight: 1.5, color: "var(--text-main)" }}>
          Deseja finalizar a viagem de <strong>{currentTripLabel}</strong>?
        </p>
      }
      confirmLabel={`Sim, Finalizar e Iniciar ${nextTripLabel}`}
      loading={loading}
      onConfirm={onConfirm}
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
        • A lista alternará automaticamente para o trajeto de <strong>{nextTripLabel}</strong>.<br />
        • A lista de embarcados será esvaziada e todos os alunos ativos ficarão prontos para o novo embarque.
      </div>
    </ConfirmModal>
  );
};
