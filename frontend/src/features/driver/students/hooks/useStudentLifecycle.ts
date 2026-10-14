import React, { useState } from "react";
import {
  deactivateDriverStudent,
  reactivateDriverStudent,
  RegisteredStudent,
  DriverStudent,
} from "../../../../api/students";
import { useToast } from "../../../../components/Toast";
import { UseRowActionReturn } from "./useRowAction";

export interface UseStudentLifecycleParams {
  setActiveStudents: React.Dispatch<React.SetStateAction<RegisteredStudent[]>>;
  setInactiveStudents: React.Dispatch<React.SetStateAction<RegisteredStudent[]>>;
  setDailyStudents: React.Dispatch<React.SetStateAction<DriverStudent[]>>;
  loadStudents: () => Promise<void>;
  rowAction: UseRowActionReturn;
}

export function useStudentLifecycle({
  setActiveStudents,
  setInactiveStudents,
  setDailyStudents,
  loadStudents,
  rowAction,
}: UseStudentLifecycleParams) {
  const { showToast } = useToast();
  const [studentToDeactivate, setStudentToDeactivate] = useState<RegisteredStudent | null>(null);

  const handleConfirmDeactivate = async () => {
    if (!studentToDeactivate) return;
    await rowAction.run(studentToDeactivate.id, "deactivate", async () => {
      try {
        await deactivateDriverStudent(studentToDeactivate.id);
        setActiveStudents((prev) => prev.filter((s) => s.id !== studentToDeactivate.id));
        setInactiveStudents((prev) =>
          [...prev, { ...studentToDeactivate, active: false }].sort((a, b) =>
            a.name.localeCompare(b.name)
          )
        );
        setDailyStudents((prev) => prev.filter((s) => s.id !== studentToDeactivate.id));
        setStudentToDeactivate(null);
        showToast(`Aluno "${studentToDeactivate.name}" movido para inativos com sucesso!`, "info");
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : "Erro ao desativar aluno.", "error");
      }
    });
  };

  const handleReactivateStudent = async (student: RegisteredStudent) => {
    await rowAction.run(student.id, "reactivate", async () => {
      try {
        await reactivateDriverStudent(student.id);
        setInactiveStudents((prev) => prev.filter((s) => s.id !== student.id));
        setActiveStudents((prev) =>
          [...prev, { ...student, active: true }].sort((a, b) => a.name.localeCompare(b.name))
        );
        await loadStudents();
        showToast(`Aluno "${student.name}" reativado na van com sucesso!`, "success");
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : "Erro ao reativar aluno.", "error");
      }
    });
  };

  return {
    studentToDeactivate,
    setStudentToDeactivate,
    handleConfirmDeactivate,
    handleReactivateStudent,
  };
}
