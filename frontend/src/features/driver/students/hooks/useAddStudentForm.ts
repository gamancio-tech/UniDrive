import React, { useState, useEffect } from "react";
import { apiRequest } from "../../../../api/client";
import { DriverClass } from "../../../../api/classes";
import { useToast } from "../../../../components/Toast";

export interface UseAddStudentFormParams {
  isOpen: boolean;
  activeClassId?: string;
  availableClasses: DriverClass[];
  onSuccess: () => Promise<void> | void;
}

export interface UseAddStudentFormReturn {
  name: string;
  setName: (name: string) => void;
  email: string;
  setEmail: (email: string) => void;
  temporaryPassword: string;
  setTemporaryPassword: (password: string) => void;
  targetClassId: string;
  setTargetClassId: (classId: string) => void;
  submitting: boolean;
  error: string | null;
  handleSubmit: (e: React.FormEvent) => Promise<void>;
  resetForm: () => void;
}

export function useAddStudentForm({
  isOpen,
  activeClassId,
  availableClasses,
  onSuccess,
}: UseAddStudentFormParams): UseAddStudentFormReturn {
  const { showToast } = useToast();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [temporaryPassword, setTemporaryPassword] = useState("");
  const [targetClassId, setTargetClassId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sincroniza a turma padrão quando o modal de cadastro é aberto
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setTargetClassId((prev) => prev || activeClassId || availableClasses[0]?.id || "");
    }
  }, [isOpen, activeClassId, availableClasses]);

  const resetForm = () => {
    setName("");
    setEmail("");
    setTemporaryPassword("");
    setTargetClassId("");
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
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
      resetForm();
      await onSuccess();
      showToast("Aluno cadastrado com sucesso!", "success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao cadastrar aluno.");
    } finally {
      setSubmitting(false);
    }
  };

  return {
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
  };
}
