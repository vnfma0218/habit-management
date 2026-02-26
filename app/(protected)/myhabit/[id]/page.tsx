import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { HabitEditForm } from "./components/HabitEditForm";

export default async function MyHabitDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: habit, error } = await supabase
    .from("habits")
    .select(
      "id,name,goal,weekly_target,time_slot,time_text,icon,color,reminder_enabled,reminder_time,user_id"
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !habit) {
    redirect("/myhabit");
  }

  return (
    <div className="w-full">
      <div className="mb-4">
        <h1 className="text-xl font-semibold">루틴 수정</h1>
        <p className="text-sm text-muted-foreground">
          원하는 항목을 수정하고 저장하세요.
        </p>
      </div>
      <HabitEditForm
        initial={{
          id: habit.id,
          name: habit.name,
          goal: habit.goal,
          weekly_target: habit.weekly_target,
          time_slot: habit.time_slot,
          time_text: habit.time_text,
          icon: habit.icon,
          color: habit.color,
          reminder_enabled: habit.reminder_enabled ?? false,
          reminder_time: habit.reminder_time ?? null,
        }}
      />
    </div>
  );
}
