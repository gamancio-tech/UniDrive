import React from "react";
import { DriverClass } from "../../../../api/classes";
import { Modal } from "../../../../components/Modal";
import { Input } from "../../../../components/Input";
import { Button } from "../../../../components/Button";
import { useAddStudentForm } from "../hooks/useAddStudentForm";

export interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeClassId?: string;
  availableClasses: DriverClass[];
  onStudentCreated: () => Promise<void> | void;
}

export const AddStudentModal: React.FC<AddStudentModalProps> = ({
  isOpen,
  onClose,
  activeClassId,
  availableClasses,
  onStudentCreated,
}) => {
  const {
    name,
    setName,
    email,
    setEmail,
    temporaryPassword,
    setTemporaryPassword,
    targetClassId,
    setTargetClassId,
    submitting,
    error,
    handleSubmit,
    resetForm,
  } = useAddStudentForm({
    isOpen,
    activeClassId,
    availableClasses,
    onSuccess: async () => {
      onClose();
      await onStudentCreated();
    },
  });

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Cadastrar Novo Aluno">
      <form onSubmit={handleSubmit}>
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
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancelar
          </Button>
        </div>
      </form>
    </Modal>
  );
};
