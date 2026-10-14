import { useMemo } from "react";
import { DriverStudent, RegisteredStudent } from "../../../../api/students";
import { filterStudentsForTrip, TripType } from "../../../../utils/trip";

export interface UseTripStudentsParams {
  dailyStudents: DriverStudent[];
  activeStudents: RegisteredStudent[];
  inactiveStudents: RegisteredStudent[];
  tripType: TripType;
  activeClassId?: string;
}

export function useTripStudents({
  dailyStudents,
  activeStudents,
  inactiveStudents,
  tripType,
  activeClassId,
}: UseTripStudentsParams) {
  const tripFilteredStudents = useMemo(
    () => filterStudentsForTrip(dailyStudents, tripType, activeClassId),
    [dailyStudents, tripType, activeClassId]
  );

  const pendingStudents = useMemo(
    () => tripFilteredStudents.filter((s) => !s.isBoarded),
    [tripFilteredStudents]
  );

  const boardedStudents = useMemo(
    () => tripFilteredStudents.filter((s) => Boolean(s.isBoarded)),
    [tripFilteredStudents]
  );

  const filteredActiveStudents = useMemo(() => {
    if (!activeClassId) return activeStudents;
    return activeStudents.filter((s) => !s.classId || s.classId === activeClassId);
  }, [activeStudents, activeClassId]);

  const filteredInactiveStudents = useMemo(() => {
    if (!activeClassId) return inactiveStudents;
    return inactiveStudents.filter((s) => !s.classId || s.classId === activeClassId);
  }, [inactiveStudents, activeClassId]);

  return {
    pendingStudents,
    boardedStudents,
    filteredActiveStudents,
    filteredInactiveStudents,
  };
}
