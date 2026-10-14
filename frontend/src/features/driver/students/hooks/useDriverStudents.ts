import { useState, useEffect, useCallback } from "react";
import {
  DriverStudent,
  RegisteredStudent,
  getDriverStudents,
  getStudentsByStatus,
} from "../../../../api/students";
import { DriverClass, getDriverClasses } from "../../../../api/classes";

const POLL_INTERVAL_MS = 15_000;

export interface UseDriverStudentsReturn {
  dailyStudents: DriverStudent[];
  activeStudents: RegisteredStudent[];
  inactiveStudents: RegisteredStudent[];
  availableClasses: DriverClass[];
  loading: boolean;
  loadStudents: (isInitial?: boolean) => Promise<void>;
  setDailyStudents: React.Dispatch<React.SetStateAction<DriverStudent[]>>;
  setActiveStudents: React.Dispatch<React.SetStateAction<RegisteredStudent[]>>;
  setInactiveStudents: React.Dispatch<React.SetStateAction<RegisteredStudent[]>>;
}

export function useDriverStudents(activeClassId?: string): UseDriverStudentsReturn {
  const [dailyStudents, setDailyStudents] = useState<DriverStudent[]>([]);
  const [activeStudents, setActiveStudents] = useState<RegisteredStudent[]>([]);
  const [inactiveStudents, setInactiveStudents] = useState<RegisteredStudent[]>([]);
  const [availableClasses, setAvailableClasses] = useState<DriverClass[]>([]);
  const [loading, setLoading] = useState(true);

  const loadStudents = useCallback(async (isInitial = false) => {
    try {
      if (isInitial) setLoading(true);
      const [dailyData, activeData, inactiveData, classesData] = await Promise.all([
        getDriverStudents(activeClassId),
        getStudentsByStatus(true, activeClassId),
        getStudentsByStatus(false, activeClassId),
        getDriverClasses().catch(() => []),
      ]);
      setDailyStudents(dailyData);
      setActiveStudents(activeData);
      setInactiveStudents(inactiveData);
      setAvailableClasses(classesData);
    } catch (err: unknown) {
      console.error("Erro ao carregar alunos:", err);
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [activeClassId]);

  useEffect(() => {
    loadStudents(true);
    const interval = setInterval(() => loadStudents(false), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadStudents]);

  return {
    dailyStudents,
    activeStudents,
    inactiveStudents,
    availableClasses,
    loading,
    loadStudents,
    setDailyStudents,
    setActiveStudents,
    setInactiveStudents,
  };
}
