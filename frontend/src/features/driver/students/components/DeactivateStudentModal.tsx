import React from "react";
import { ConfirmModal } from "../../../../components/ConfirmModal";
import { RegisteredStudent } from "../../../../api/students";

export interface DeactivateStudentModalProps {
  student: RegisteredStudent | null;
  onClose: () => void;
  loading: boolean;
  onConfirm: () => Promise<void> | void;
}

export const DeactivateStudentModal: React.FC<DeactivateStudentModalProps> = ({
  student,
  onClose,
  loading,
  onConfirm,
}) => {
  return (
    <ConfirmModal
      isOpen={Boolean(student)}
      onClose={onClose}
      title="Desativar Aluno da Van"
      message={
        <>
          <p style={{ margin: 0, lineHeight: 1.5, color: "var(--text-main)" }}>
            Deseja realmente desativar <strong>{student?.name}</strong> da sua van?
          </p>
          <p style={{ margin: 0, color: "var(--text-muted)", fontSize: "0.85rem" }}>
            O aluno será movido para a lista de <strong>Inativos</strong> e deixará de constar nas listas de presença diária e contagem de faltantes. Você poderá reativá-lo a qualquer momento.
          </p>
        </>
      }
      confirmLabel="Confirmar Desativação"
      variant="danger"
      loading={loading}
      onConfirm={onConfirm}
    />
  );
};
