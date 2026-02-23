import { createClient } from "@/lib/supabase/server";
import { TodayHabitDTO } from "@/lib/habits/api";
import { MyHabitList } from "./components/MyHabitList";

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default async function MyHabit() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return <MyHabitList habits={[]} />;
  }

  const date = toISODate(new Date());

  const { data: habits, error: habitsError } = await supabase
    .from("habits")
    .select(
      "id,name,goal,weekly_target,time_slot,time_text,icon,color,order_in_time,is_active"
    )
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("time_slot", { ascending: true })
    .order("order_in_time", { ascending: true });

  if (habitsError || !habits) {
    return <div className="text-sm text-red-600">불러오기 실패</div>;
  }

  const habitIds = habits.map((habit) => habit.id);
  if (habitIds.length === 0) {
    return <MyHabitList habits={[]} />;
  }

  const { data: logs, error: logsError } = await supabase
    .from("habit_logs")
    .select("habit_id,is_done")
    .eq("user_id", user.id)
    .eq("log_date", date)
    .in("habit_id", habitIds);

  if (logsError) {
    return <div className="text-sm text-red-600">불러오기 실패</div>;
  }

  const logMap = new Map<string, boolean>();
  (logs ?? []).forEach((log) => logMap.set(log.habit_id, log.is_done));

  const merged: TodayHabitDTO[] = habits.map((habit) => ({
    ...habit,
    done: logMap.get(habit.id) ?? false,
    log_date: date,
  }));

  return <MyHabitList habits={merged} />;
}
