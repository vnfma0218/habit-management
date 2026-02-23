import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { HabitTime } from "@/lib/habits/api";

type ReorderItem = {
  id: string;
  time_slot: HabitTime;
  order_in_time: number;
};

export async function POST(req: Request) {
  const supabase = await createClient();
  const user = await supabase.auth.getUser();
  const userId = user.data.user?.id;
  try {
    const body = await req.json();

    const items = body?.items as ReorderItem[];

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Missing items" }, { status: 400 });
    }

    // 최소 검증
    for (const it of items) {
      if (!it?.id) {
        return NextResponse.json(
          { error: "Invalid item: missing id" },
          { status: 400 }
        );
      }
      if (!["morning", "afternoon", "evening"].includes(it.time_slot)) {
        return NextResponse.json(
          { error: "Invalid time_slot" },
          { status: 400 }
        );
      }
      if (!Number.isFinite(it.order_in_time)) {
        return NextResponse.json(
          { error: "Invalid order_in_time" },
          { status: 400 }
        );
      }
    }

    const supabase = await createClient();

    const { error } = await supabase.rpc("reorder_habits_admin", {
      p_user_id: userId,
      p_items: items,
    });

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "Failed to reorder" },
      { status: 500 }
    );
  }
}
