import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

function toISODate(d: Date) {
  // KST 기준이 필요하면 서버 타임존/혹은 date param으로 통일 추천
  return d.toISOString().slice(0, 10);
}

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(req.url);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;
    const date = searchParams.get("date") ?? toISODate(new Date());

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    // 1) habits 가져오기 (활성화된 것만)
    const { data: habits, error: habitsError } = await supabase
      .from("habits")
      .select(
        "id,name,goal,weekly_target,time_slot,time_text,icon,color,order_in_time,is_active"
      )
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("time_slot", { ascending: true })
      .order("order_in_time", { ascending: true });

    if (habitsError) throw habitsError;

    const habitIds = (habits ?? []).map((h) => h.id);

    // 2) 오늘 logs 가져오기 (해당 habits만)
    const { data: logs, error: logsError } = await supabase
      .from("habit_logs")
      .select("habit_id,is_done")
      .eq("user_id", userId)
      .eq("log_date", date)
      .in("habit_id", habitIds);

    if (logsError) throw logsError;

    const logMap = new Map<string, boolean>();
    (logs ?? []).forEach((l) => logMap.set(l.habit_id, l.is_done));

    const merged = (habits ?? []).map((h) => ({
      ...h,
      done: logMap.get(h.id) ?? false,
      log_date: date,
    }));

    return NextResponse.json({ habits: merged });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Failed to load habits" },
      { status: 500 }
    );
  }
}
