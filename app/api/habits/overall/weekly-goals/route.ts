import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentKSTDateString } from "@/lib/date/kst";

type TimeSlot = "morning" | "afternoon" | "evening";

const timeOrder: Record<TimeSlot, number> = {
  morning: 0,
  afternoon: 1,
  evening: 2,
};

function getErrorMessage(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Failed to load weekly goal progress";
}

function getWeekRangeFromDate(dateString: string) {
  const current = new Date(`${dateString}T00:00:00Z`);
  const mondayOffset = (current.getUTCDay() + 6) % 7; // Mon=0 ... Sun=6

  const start = new Date(current);
  start.setUTCDate(start.getUTCDate() - mondayOffset);

  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 6);

  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export async function GET() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const today = getCurrentKSTDateString();
    const { start: periodStart, end: periodEnd } = getWeekRangeFromDate(today);

    const { data: habits, error: habitsError } = await supabase
      .from("habits")
      .select("id,name,icon,weekly_target,time_slot,order_in_time")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("time_slot", { ascending: true })
      .order("order_in_time", { ascending: true });

    if (habitsError) throw habitsError;

    const sortedHabits = [...(habits ?? [])].sort((a, b) => {
      const gap =
        timeOrder[a.time_slot as TimeSlot] - timeOrder[b.time_slot as TimeSlot];
      if (gap !== 0) return gap;
      return a.order_in_time - b.order_in_time;
    });

    const habitIds = sortedHabits.map((habit) => habit.id);
    if (habitIds.length === 0) {
      return NextResponse.json({
        periodStart,
        periodEnd,
        habits: [],
      });
    }

    const { data: logs, error: logsError } = await supabase
      .from("habit_logs")
      .select("habit_id,log_date,is_done")
      .eq("user_id", userId)
      .gte("log_date", periodStart)
      .lte("log_date", periodEnd)
      .eq("is_done", true)
      .in("habit_id", habitIds);

    if (logsError) throw logsError;

    const completedCountMap = new Map<string, number>();
    const dedupe = new Set<string>();
    for (const log of logs ?? []) {
      const key = `${log.habit_id}:${log.log_date}`;
      if (dedupe.has(key)) continue;
      dedupe.add(key);
      completedCountMap.set(
        log.habit_id,
        (completedCountMap.get(log.habit_id) ?? 0) + 1
      );
    }

    const progressHabits = sortedHabits.map((habit) => {
      const completed = completedCountMap.get(habit.id) ?? 0;
      const target = habit.weekly_target;
      const rate = target > 0 ? Math.round((completed / target) * 100) : 0;
      return {
        id: habit.id,
        name: habit.name,
        icon: habit.icon,
        completed,
        target,
        rate,
      };
    });

    return NextResponse.json({
      periodStart,
      periodEnd,
      habits: progressHabits,
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
