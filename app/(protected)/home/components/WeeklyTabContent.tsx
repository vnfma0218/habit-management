"use client";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { DayKey, WeeklyHabitDTO } from "@/lib/habits/api";
import { useWeeklyHabits } from "@/lib/habits/useWeeklyHabits";

const DAYS: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getCadenceLabel(weeklyTarget: number) {
  if (weeklyTarget >= 7) return "Everyday";
  return `${weeklyTarget} days per week`;
}

export function WeeklyTabContent() {
  const { data, isLoading, isError } = useWeeklyHabits();

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
        <HabitCard key={habit.id} habit={habit} />
      ))}
    </div>
  );
}

function HabitCard({ habit }: { habit: WeeklyHabitDTO }) {
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
}: {
  checked: boolean;
  checkedColor: string;
}) {
  return (
    <button
      type="button"
      disabled
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
