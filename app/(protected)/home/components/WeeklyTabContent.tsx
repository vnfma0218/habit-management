"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { DayKey, WeeklyHabitDTO, WeeklyHabitsResponseDTO } from "@/lib/habits/api";
import { useWeeklyHabits } from "@/lib/habits/useWeeklyHabits";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { habitKeys } from "@/lib/habits/keys";
import { toast } from "sonner";

const DAYS: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DAY_INDEX: Record<DayKey, number> = {
  Mon: 0,
  Tue: 1,
  Wed: 2,
  Thu: 3,
  Fri: 4,
  Sat: 5,
  Sun: 6,
};

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function dateForDay(weekStart: string, day: DayKey) {
  const d = new Date(`${weekStart}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + DAY_INDEX[day]);
  return toISODate(d);
}

function getCadenceLabel(weeklyTarget: number) {
  if (weeklyTarget >= 7) return "Everyday";
  return `${weeklyTarget} days per week`;
}

async function patchHabitDone(params: {
  habitId: string;
  done: boolean;
  log_date: string;
}) {
  const res = await fetch(`/api/habits/${params.habitId}/done`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      done: params.done,
      log_date: params.log_date,
    }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to update weekly check");
  return json.log as { habit_id: string; is_done: boolean; log_date: string };
}

export function WeeklyTabContent() {
  const qc = useQueryClient();
  const { data, isLoading, isError } = useWeeklyHabits();
  const weekStart = data?.weekStart;

  const toggleMut = useMutation({
    mutationFn: (vars: { habitId: string; day: DayKey; nextChecked: boolean }) =>
      patchHabitDone({
        habitId: vars.habitId,
        done: vars.nextChecked,
        log_date: dateForDay(weekStart!, vars.day),
      }),
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: habitKeys.weekly });
      const prev = qc.getQueryData<WeeklyHabitsResponseDTO>(habitKeys.weekly);

      qc.setQueryData<WeeklyHabitsResponseDTO>(habitKeys.weekly, (old) => {
        if (!old) return old;
        return {
          ...old,
          habits: old.habits.map((habit: WeeklyHabitDTO) =>
            habit.id === vars.habitId
              ? {
                  ...habit,
                  checked: { ...habit.checked, [vars.day]: vars.nextChecked },
                }
              : habit
          ),
        };
      });

      return { prev };
    },
    onError: (error, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(habitKeys.weekly, ctx.prev);
      toast.error(
        error instanceof Error ? error.message : "주간 체크 변경에 실패했습니다."
      );
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: habitKeys.weekly });
      qc.invalidateQueries({ queryKey: habitKeys.today });
    },
  });

  if (isLoading) {
    return (
      <div className="w-full p-4 text-sm text-muted-foreground">
        Loading weekly habits...
      </div>
    );
  }

  if (isError) {
    return (
      <div className="w-full p-4 text-sm text-red-500">
        Failed to load weekly habits.
      </div>
    );
  }

  const habits = data?.habits ?? [];

  return (
    <div className="w-full space-y-3 p-3">
      {habits.length === 0 ? (
        <div className="p-4 text-sm text-muted-foreground">
          No habits yet for this week.
        </div>
      ) : null}
      {habits.map((habit) => (
        <HabitCard
          key={habit.id}
          habit={habit}
          onToggle={(day) => {
            if (!weekStart) return;
            const nextChecked = !Boolean(habit.checked[day]);
            toggleMut.mutate({
              habitId: habit.id,
              day,
              nextChecked,
            });
          }}
        />
      ))}
    </div>
  );
}

function HabitCard({
  habit,
  onToggle,
}: {
  habit: WeeklyHabitDTO;
  onToggle: (day: DayKey) => void;
}) {
  return (
    <Card className="rounded-2xl border bg-white/90 p-4 shadow-sm gap-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{habit.icon}</span>
          <div className="text-[15px] font-semibold text-foreground">
            {habit.name}
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          {getCadenceLabel(habit.weekly_target)}
        </div>
      </div>
      <Separator className="my-1" />

      <div className="">
        <div className="grid grid-cols-7 gap-3">
          {DAYS.map((day) => (
            <div key={day} className="flex flex-col items-center gap-2">
              <div
                className={cn(
                  "text-xs font-medium",
                  day === "Sun" ? "text-primary" : "text-muted-foreground"
                )}
              >
                {day}
              </div>

              <DayDot
                checkedColor={habit.color}
                checked={Boolean(habit.checked[day])}
                onClick={() => onToggle(day)}
              />
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

function DayDot({
  checked,
  checkedColor,
  onClick,
}: {
  checked: boolean;
  checkedColor: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative grid h-8 w-8 sm:h-11 sm:w-11 place-items-center rounded-full border transition",
        "active:scale-[0.98]",
        checked ? "border-transparent" : "bg-white border-border"
      )}
      style={checked ? { backgroundColor: checkedColor } : undefined}
      aria-pressed={checked}
    >
      {checked ? (
        <Check className="h-5 w-5 text-foreground" strokeWidth={2.5} />
      ) : null}
    </button>
  );
}
