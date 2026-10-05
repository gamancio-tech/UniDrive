import { apiRequest } from "./client";
import { DailyStatusValue } from "../features/dailyStatus/useDailyStatus";

export interface WeeklyScheduleDay {
  dayOfWeek: number;
  dayName: string;
  status: DailyStatusValue;
}

export async function getWeeklySchedule(): Promise<WeeklyScheduleDay[]> {
  return apiRequest<WeeklyScheduleDay[]>("/students/me/weekly-schedule");
}

export async function updateWeeklySchedule(
  schedules: { dayOfWeek: number; status: DailyStatusValue }[]
): Promise<{ message: string; schedules: WeeklyScheduleDay[] }> {
  return apiRequest<{ message: string; schedules: WeeklyScheduleDay[] }>(
    "/students/me/weekly-schedule",
    {
      method: "PUT",
      body: { schedules },
    }
  );
}
