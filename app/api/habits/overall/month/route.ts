import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  getCurrentKSTMonthString,
  getMonthRangeFromMonthString,
} from "@/lib/date/kst";

type OverallDayDTO = {
  date: string;
  completed: number;
  total: number;
  rate: number;
  level: number;
};

function levelFromRate(rate: number) {
  if (rate <= 0) return 0;
  if (rate <= 25) return 1;
  if (rate <= 50) return 2;
  if (rate <= 75) return 3;
  return 4;
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Failed to load overall data";
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

    const month = searchParams.get("month") ?? getCurrentKSTMonthString();
    const range = getMonthRangeFromMonthString(month);
    if (!range) {
      return NextResponse.json(
        { error: "Invalid month format. Expected YYYY-MM" },
        { status: 400 }
      );
    }

    const { data: habits, error: habitsError } = await supabase
      .from("habits")
      .select("id")
      .eq("user_id", userId)
      .eq("is_active", true);
    if (habitsError) throw habitsError;

    const habitIds = (habits ?? []).map((h) => h.id);
    const totalHabits = habitIds.length;

    const dayResults: OverallDayDTO[] = [];
    const first = new Date(`${range.start}T00:00:00Z`);
    const last = new Date(`${range.end}T00:00:00Z`);

    const doneMap = new Map<string, number>();
    if (habitIds.length > 0) {
      const { data: logs, error: logsError } = await supabase
        .from("habit_logs")
        .select("log_date,habit_id,is_done")
        .eq("user_id", userId)
        .gte("log_date", range.start)
        .lte("log_date", range.end)
        .eq("is_done", true)
        .in("habit_id", habitIds);
      if (logsError) throw logsError;

      const keySet = new Set<string>();
      for (const log of logs ?? []) {
        const dedupeKey = `${log.log_date}:${log.habit_id}`;
        if (keySet.has(dedupeKey)) continue;
        keySet.add(dedupeKey);
        doneMap.set(log.log_date, (doneMap.get(log.log_date) ?? 0) + 1);
      }
    }

    for (let d = first; d <= last; d = new Date(d.getTime() + 24 * 60 * 60 * 1000)) {
      const date = d.toISOString().slice(0, 10);
      const completed = doneMap.get(date) ?? 0;
      const total = totalHabits;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
      dayResults.push({
        date,
        completed,
        total,
        rate,
        level: levelFromRate(rate),
      });
    }

    return NextResponse.json({
      month,
      timezone: "Asia/Seoul",
      days: dayResults,
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
