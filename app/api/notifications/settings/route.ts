import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function isValidReminderTime(value: string) {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);
}

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("notification_subscriptions")
    .select("id,reminder_time,timezone,is_enabled")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    reminder_time: data?.reminder_time ?? "20:00",
    timezone: data?.timezone ?? "Asia/Seoul",
    is_enabled: data?.is_enabled ?? false,
    has_subscription: Boolean(data),
  });
}

export async function PATCH(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = (await req.json()) as {
    reminder_time?: string;
    is_enabled?: boolean;
  };

  const reminderTime = body.reminder_time ?? "20:00";
  if (!isValidReminderTime(reminderTime)) {
    return NextResponse.json(
      { error: "Invalid reminder_time. Expected HH:MM" },
      { status: 400 }
    );
  }

  const isEnabled = Boolean(body.is_enabled);

  const { error } = await supabase
    .from("notification_subscriptions")
    .update({
      reminder_time: reminderTime,
      timezone: "Asia/Seoul",
      is_enabled: isEnabled,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
