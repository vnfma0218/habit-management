import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCurrentKSTDateString, getCurrentKSTTimeString } from "@/lib/date/kst";
import { sendPushToSubscription } from "@/lib/notifications/webpush";

async function handleCron(req: Request) {
  const auth = req.headers.get("authorization");
  const secret = process.env.CRON_SECRET;

  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const supabase = await createClient();
  const nowTime = getCurrentKSTTimeString();
  const today = getCurrentKSTDateString();

  const { data: rows, error } = await supabase
    .from("notification_subscriptions")
    .select("id,endpoint,p256dh,auth,last_sent_date")
    .eq("is_enabled", true)
    .eq("timezone", "Asia/Seoul")
    .eq("reminder_time", nowTime);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  let sent = 0;
  const failedIds: string[] = [];

  for (const row of rows ?? []) {
    if (row.last_sent_date === today) continue;
    try {
      await sendPushToSubscription(row, {
        title: "루틴 리마인더",
        body: "지금 루틴을 실행해보세요. 작은 행동이 쌓이면 커집니다.",
        url: "/home",
      });
      sent += 1;

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
