import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCurrentKSTDateString, getCurrentKSTTimeString } from "@/lib/date/kst";
import { sendPushToSubscription } from "@/lib/notifications/webpush";

async function handleCron(req: Request) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const nowTime = getCurrentKSTTimeString();
  const today = getCurrentKSTDateString();

  const { data: rows, error } = await supabase
    .from("notification_subscriptions")
    .select("id,user_id,endpoint,p256dh,auth,last_sent_date")
    .eq("is_enabled", true)
    .eq("timezone", "Asia/Seoul");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const userIds = Array.from(new Set((rows ?? []).map((row) => row.user_id)));
  if (userIds.length === 0) {
    return NextResponse.json({
      ok: true,
      time: nowTime,
      date: today,
      sent: 0,
      failed: 0,
    });
  }

  const { data: dueHabits, error: habitsError } = await supabase
    .from("habits")
    .select("id,user_id,name,reminder_time,last_reminded_date")
    .in("user_id", userIds)
    .eq("is_active", true)
    .eq("reminder_enabled", true)
    .lte("reminder_time", nowTime);

  if (habitsError) {
    return NextResponse.json({ error: habitsError.message }, { status: 400 });
  }

  const habitsByUser = new Map<
    string,
    Array<{ id: string; name: string; reminder_time: string | null; last_reminded_date: string | null }>
  >();
  for (const habit of dueHabits ?? []) {
    if (habit.last_reminded_date === today) continue;
    const list = habitsByUser.get(habit.user_id) ?? [];
    list.push(habit);
    habitsByUser.set(habit.user_id, list);
  }

  let sent = 0;
  const failedIds: string[] = [];
  const remindedHabitIds = new Set<string>();

  for (const row of rows ?? []) {
    if (row.last_sent_date === today) continue;
    const userDueHabits = habitsByUser.get(row.user_id) ?? [];
    if (userDueHabits.length === 0) continue;

    const names = userDueHabits.slice(0, 3).map((habit) => habit.name).join(", ");
    const moreCount = userDueHabits.length - 3;
    const body =
      moreCount > 0
        ? `${names} 외 ${moreCount}개의 루틴을 실행할 시간이에요.`
        : `${names} 루틴을 실행할 시간이에요.`;

    try {
      await sendPushToSubscription(row, {
        title: "루틴 리마인더",
        body,
        url: "/home",
      });
      sent += 1;
      userDueHabits.forEach((habit) => remindedHabitIds.add(habit.id));

      await supabase
        .from("notification_subscriptions")
        .update({
          last_sent_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);
    } catch {
      failedIds.push(row.id);
    }
  }

  if (remindedHabitIds.size > 0) {
    await supabase
      .from("habits")
      .update({
        last_reminded_date: today,
      })
      .in("id", Array.from(remindedHabitIds));
  }

  return NextResponse.json({
    ok: true,
    time: nowTime,
    date: today,
    sent,
    failed: failedIds.length,
  });
}

export async function GET(req: Request) {
  return handleCron(req);
}

export async function POST(req: Request) {
  return handleCron(req);
}
