export type HabitTime = "morning" | "afternoon" | "evening";
export type DayKey = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

export type TodayHabitDTO = {
  id: string;
  name: string;
  goal: string | null;
  weekly_target: number;
  time_slot: HabitTime;
  time_text: string | null;
  icon: string;
  color: string;
  order_in_time: number;
  is_active: boolean;
  done: boolean; // ✅ habit_logs에서 합쳐서 내려준 값
  log_date: string; // ✅ YYYY-MM-DD
};

export type WeeklyHabitDTO = {
  id: string;
  name: string;
  weekly_target: number;
  icon: string;
  color: string;
  checked: Partial<Record<DayKey, boolean>>;
};

export type WeeklyHabitsResponseDTO = {
  weekStart: string;
  weekEnd: string;
  habits: WeeklyHabitDTO[];
};

export type OverallMonthDayDTO = {
  date: string;
  completed: number;
  total: number;
  rate: number;
  level: number;
};

export type OverallMonthResponseDTO = {
  month: string; // YYYY-MM
  timezone: "Asia/Seoul";
  days: OverallMonthDayDTO[];
};

export type OverallDayHabitDTO = {
  id: string;
  name: string;
  icon: string;
  color: string;
  time_slot: HabitTime;
  time_text: string | null;
  done: boolean;
};

export type OverallDayResponseDTO = {
  date: string; // YYYY-MM-DD
  completed: number;
  total: number;
  rate: number;
  habits: OverallDayHabitDTO[];
};

export type OverallWeeklyGoalHabitDTO = {
  id: string;
  name: string;
  icon: string;
  completed: number;
  target: number;
  rate: number;
};

export type OverallWeeklyGoalsResponseDTO = {
  periodStart: string;
  periodEnd: string;
  habits: OverallWeeklyGoalHabitDTO[];
};

export async function fetchTodayHabits(): Promise<TodayHabitDTO[]> {
  const res = await fetch(`/api/habits/today`, {
    method: "GET",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to fetch habits");
  return json.habits as TodayHabitDTO[];
}

export async function fetchWeeklyHabits(): Promise<WeeklyHabitsResponseDTO> {
  const res = await fetch(`/api/habits/weekly`, {
    method: "GET",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to fetch weekly habits");
  return json as WeeklyHabitsResponseDTO;
}

export async function fetchOverallMonth(
  month: string
): Promise<OverallMonthResponseDTO> {
  const res = await fetch(`/api/habits/overall/month?month=${month}`, {
    method: "GET",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to fetch overall month");
  return json as OverallMonthResponseDTO;
}

export async function fetchOverallDay(
  date: string
): Promise<OverallDayResponseDTO> {
  const res = await fetch(`/api/habits/overall/day?date=${date}`, {
    method: "GET",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to fetch overall day");
  return json as OverallDayResponseDTO;
}

export async function fetchOverallWeeklyGoals(): Promise<OverallWeeklyGoalsResponseDTO> {
  const res = await fetch(`/api/habits/overall/weekly-goals`, {
    method: "GET",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.error ?? "Failed to fetch weekly goal progress");
  }
  return json as OverallWeeklyGoalsResponseDTO;
}
