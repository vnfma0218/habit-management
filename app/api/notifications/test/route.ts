import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendPushToSubscription } from "@/lib/notifications/webpush";

export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { data: rows, error } = await supabase
    .from("notification_subscriptions")
    .select("id,endpoint,p256dh,auth,last_sent_date")
    .eq("user_id", user.id)
    .eq("is_enabled", true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (!rows || rows.length === 0) {
    return NextResponse.json(
      { error: "No active notification subscription" },
      { status: 400 }
    );
  }

  let success = 0;
  for (const row of rows) {
    try {
      await sendPushToSubscription(row, {
        title: "루틴 리마인더",
        body: "지금 오늘 루틴을 체크해볼 시간이에요.",
        url: "/home",
      });
      success += 1;
    } catch {
      // ignore failed endpoint in test mode
    }
  }

  return NextResponse.json({ ok: true, sent: success });
}
