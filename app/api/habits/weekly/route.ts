import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

type DayKey = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function parseISODate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const d = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return toISODate(d) === value ? d : null;
}

function startOfWeekUTC(base: Date) {
  const d = new Date(
    Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate())
  );
  const mondayIndex = (d.getUTCDay() + 6) % 7; // Mon=0 ... Sun=6
  d.setUTCDate(d.getUTCDate() - mondayIndex);
  return d;
}

function dayKeyFromISODate(isoDate: string): DayKey {
  const d = new Date(`${isoDate}T00:00:00Z`);
  const day = d.getUTCDay();
  if (day === 0) return "Sun";
  if (day === 1) return "Mon";
  if (day === 2) return "Tue";
  if (day === 3) return "Wed";
  if (day === 4) return "Thu";
  if (day === 5) return "Fri";
  return "Sat";
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Failed to load weekly habits";
}

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const startParam = searchParams.get("start");
    const baseDate = startParam ? parseISODate(startParam) : new Date();

    if (!baseDate) {
      return NextResponse.json(
        { error: "Invalid start date. Expected YYYY-MM-DD" },
        { status: 400 }
      );
    }

    const weekStartDate = startOfWeekUTC(baseDate);
    const weekStart = toISODate(weekStartDate);
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setUTCDate(weekEndDate.getUTCDate() + 6);
    const weekEnd = toISODate(weekEndDate);

    const { data: habits, error: habitsError } = await supabase
      .from("habits")
      .select("id,name,weekly_target,icon,color,time_slot,order_in_time")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("time_slot", { ascending: true })
      .order("order_in_time", { ascending: true });

    if (habitsError) throw habitsError;

    const habitIds = (habits ?? []).map((h) => h.id);
    if (habitIds.length === 0) {
      return NextResponse.json({ weekStart, weekEnd, habits: [] });
    }

    const { data: logs, error: logsError } = await supabase
      .from("habit_logs")
      .select("habit_id,log_date,is_done")
      .eq("user_id", userId)
      .gte("log_date", weekStart)
      .lte("log_date", weekEnd)
      .in("habit_id", habitIds);

    if (logsError) throw logsError;

    const checkedMap = new Map<string, Partial<Record<DayKey, boolean>>>();
    for (const log of logs ?? []) {
      const dayKey = dayKeyFromISODate(log.log_date);
      const dayState = checkedMap.get(log.habit_id) ?? {};
      dayState[dayKey] = Boolean(log.is_done);
      checkedMap.set(log.habit_id, dayState);
    }

    const weeklyHabits = (habits ?? []).map((habit) => ({
      id: habit.id,
      name: habit.name,
      weekly_target: habit.weekly_target,
      icon: habit.icon,
      color: habit.color,
      checked: checkedMap.get(habit.id) ?? {},
    }));

    return NextResponse.json({
      weekStart,
      weekEnd,
      habits: weeklyHabits,
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
