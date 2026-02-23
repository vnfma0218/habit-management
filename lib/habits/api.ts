export type HabitTime = "morning" | "afternoon" | "evening";

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
export async function fetchTodayHabits(): Promise<TodayHabitDTO[]> {
  const res = await fetch(`/api/habits/today`, {
    method: "GET",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to fetch habits");
  return json.habits as TodayHabitDTO[];
}
