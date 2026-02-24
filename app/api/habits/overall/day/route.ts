import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentKSTDateString } from "@/lib/date/kst";

type TimeSlot = "morning" | "afternoon" | "evening";

const timeOrder: Record<TimeSlot, number> = {
  morning: 0,
  afternoon: 1,
  evening: 2,
};

function isISODate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Failed to load day detail";
}

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") ?? getCurrentKSTDateString();

    if (!isISODate(date)) {
      return NextResponse.json(
        { error: "Invalid date format. Expected YYYY-MM-DD" },
        { status: 400 }
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const { data: habits, error: habitsError } = await supabase
      .from("habits")
      .select("id,name,icon,color,time_slot,time_text,order_in_time")
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

    let logMap = new Map<string, boolean>();
    if (habitIds.length > 0) {
      const { data: logs, error: logsError } = await supabase
        .from("habit_logs")
        .select("habit_id,is_done")
        .eq("user_id", userId)
        .eq("log_date", date)
        .in("habit_id", habitIds);
      if (logsError) throw logsError;

      logMap = new Map<string, boolean>();
      for (const log of logs ?? []) {
        logMap.set(log.habit_id, Boolean(log.is_done));
      }
    }

    const merged = sortedHabits.map((habit) => ({
      id: habit.id,
      name: habit.name,
      icon: habit.icon,
      color: habit.color,
      time_slot: habit.time_slot as TimeSlot,
      time_text: habit.time_text,
      done: logMap.get(habit.id) ?? false,
    }));

    const completed = merged.filter((habit) => habit.done).length;
    const total = merged.length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return NextResponse.json({
      date,
      completed,
      total,
      rate,
      habits: merged,
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
