import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const user = await supabase.auth.getUser();
  try {
    const { id: habitId } = await ctx.params;
    const body = await req.json();

    const userId = user.data.user?.id;
    const done = Boolean(body?.done);
    const log_date = String(body?.log_date ?? "");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }
    if (!log_date) {
      return NextResponse.json({ error: "Missing log_date" }, { status: 400 });
    }

    // ✅ 해당 habit이 user 소유인지 확인(보안)
    const { data: habit, error: habitError } = await supabase
      .from("habits")
      .select("id")
      .eq("id", habitId)
      .eq("user_id", userId)
      .single();

    if (habitError || !habit) {
      return NextResponse.json({ error: "Habit not found" }, { status: 404 });
    }

    const { data, error } = await supabase
      .from("habit_logs")
      .upsert(
        {
          habit_id: habitId,
          user_id: userId,
          log_date,
          is_done: done,
        },
        { onConflict: "habit_id,log_date" }
      )
      .select("habit_id,is_done,log_date")
      .single();

    if (error) throw error;

    return NextResponse.json({ log: data });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Failed to update log" },
      { status: 500 }
    );
  }
}
