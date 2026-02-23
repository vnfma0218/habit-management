import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type TimeSlot = "morning" | "afternoon" | "evening";

function isTimeSlot(v: unknown): v is TimeSlot {
  return v === "morning" || v === "afternoon" || v === "evening";
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id: habitId } = await ctx.params;
  const { name, weekly_target, time_slot, time_text, goal, icon, color } =
    (await req.json()) as {
      name?: string;
      weekly_target?: number;
      time_slot?: TimeSlot;
      time_text?: string;
      goal?: string;
      icon?: string;
      color?: string;
    };

  const cleanName = (name ?? "").trim();
  if (!cleanName) {
    return NextResponse.json({ error: "이름은 필수입니다." }, { status: 400 });
  }
  if (
    !Number.isFinite(weekly_target) ||
    weekly_target! < 1 ||
    weekly_target! > 7
  ) {
    return NextResponse.json(
      { error: "반복(주간 횟수)은 1~7 사이여야 합니다." },
      { status: 400 }
    );
  }
  if (!isTimeSlot(time_slot)) {
    return NextResponse.json(
      { error: "시간대는 오전/오후/저녁 중 하나여야 합니다." },
      { status: 400 }
    );
  }
  if (!icon) {
    return NextResponse.json(
      { error: "아이콘을 선택해주세요." },
      { status: 400 }
    );
  }
  if (!color) {
    return NextResponse.json(
      { error: "색상을 선택해주세요." },
      { status: 400 }
    );
  }

  const { data: existing, error: existingError } = await supabase
    .from("habits")
    .select("id,time_slot,order_in_time")
    .eq("id", habitId)
    .eq("user_id", user.id)
    .single();

  if (existingError || !existing) {
    return NextResponse.json({ error: "Habit not found" }, { status: 404 });
  }

  let nextOrder = existing.order_in_time;
  if (existing.time_slot !== time_slot) {
    const { data: last, error: lastErr } = await supabase
      .from("habits")
      .select("order_in_time")
      .eq("user_id", user.id)
      .eq("time_slot", time_slot)
      .neq("id", habitId)
      .order("order_in_time", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lastErr) {
      return NextResponse.json({ error: lastErr.message }, { status: 400 });
    }
    nextOrder = (last?.order_in_time ?? 0) + 10;
  }

  const { data, error } = await supabase
    .from("habits")
    .update({
      name: cleanName,
      weekly_target,
      time_slot,
      time_text: (time_text ?? "").trim() || null,
      goal: (goal ?? "").trim() || null,
      icon,
      color,
      order_in_time: nextOrder,
    })
    .eq("id", habitId)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ data }, { status: 200 });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { id: habitId } = await ctx.params;

  const { data: existing, error: existingError } = await supabase
    .from("habits")
    .select("id")
    .eq("id", habitId)
    .eq("user_id", user.id)
    .single();

  if (existingError || !existing) {
    return NextResponse.json({ error: "Habit not found" }, { status: 404 });
  }

  const { error } = await supabase
    .from("habits")
    .update({ is_active: false })
    .eq("id", habitId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}
