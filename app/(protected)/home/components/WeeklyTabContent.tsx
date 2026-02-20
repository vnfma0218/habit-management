"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { Separator } from "@/components/ui/separator";

type DayKey = "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
const DAYS: DayKey[] = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

type Habit = {
  id: string;
  title: string;
  emoji: string;
  cadenceLabel: string; // "Everyday" | "5 days per week" ...
  colorClass:
    | "bg-rose-200"
    | "bg-emerald-200"
    | "bg-indigo-200"
    | "bg-sky-200"
    | "bg-orange-200";
  checked: Partial<Record<DayKey, boolean>>;
};

const HABITS: Habit[] = [
  {
    id: "1",
    title: "Set Small Goals",
    emoji: "🎯",
    cadenceLabel: "Everyday",
    colorClass: "bg-rose-200",
    checked: {
      Mon: true,
      Tue: true,
      Wed: true,
      Thu: true,
      Fri: true,
      Sat: true,
    },
  },
  {
    id: "2",
    title: "Meditation",
    emoji: "😇",
    cadenceLabel: "5 days per week",
    colorClass: "bg-emerald-200",
    checked: { Mon: true, Tue: true, Wed: true, Fri: true },
  },
  {
    id: "3",
    title: "Work",
    emoji: "🏆",
    cadenceLabel: "Everyday",
    colorClass: "bg-indigo-200",
    checked: {
      Mon: true,
      Tue: true,
      Wed: true,
      Thu: true,
      Fri: true,
      Sat: true,
    },
  },
  {
    id: "4",
    title: "Sleep Over 8h",
    emoji: "😴",
    cadenceLabel: "Everyday",
    colorClass: "bg-sky-200",
    checked: {
      Mon: true,
      Tue: true,
      Wed: true,
      Thu: true,
      Fri: true,
      Sat: true,
      Sun: true,
    },
  },
  {
    id: "5",
    title: "Basketball",
    emoji: "🏀",
    cadenceLabel: "5 days per week",
    colorClass: "bg-orange-200",
    checked: { Mon: true, Wed: true, Fri: true, Sat: true },
  },
];

export function WeeklyTabContent() {
  const [habits, setHabits] = React.useState<Habit[]>(HABITS);

  const toggle = (habitId: string, day: DayKey) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const next = !Boolean(h.checked[day]);
        return { ...h, checked: { ...h.checked, [day]: next } };
      })
    );
  };

  return (
    <div className="w-full space-y-3 p-3">
      {habits.map((habit) => (
        <HabitCard key={habit.id} habit={habit} onToggle={toggle} />
      ))}
    </div>
  );
}

function HabitCard({
  habit,
  onToggle,
}: {
  habit: Habit;
  onToggle: (habitId: string, day: DayKey) => void;
}) {
  return (
    <Card className="rounded-2xl border bg-white/90 p-4 shadow-sm gap-0">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{habit.emoji}</span>
          <div className="text-[15px] font-semibold text-foreground">
            {habit.title}
          </div>
        </div>

        <div className="text-sm text-muted-foreground">
          {habit.cadenceLabel}
        </div>
      </div>
      <Separator className="my-1" />

      {/* Week row */}
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
                checkedProfessionColor={habit.colorClass}
                checked={Boolean(habit.checked[day])}
                onClick={() => onToggle(habit.id, day)}
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
  onClick,
  checkedProfessionColor,
}: {
  checked: boolean;
  onClick: () => void;
  checkedProfessionColor: Habit["colorClass"];
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative grid h-8 w-8 sm:h-11 sm:w-11 place-items-center rounded-full border transition",
        "active:scale-[0.98]",
        checked
          ? cn(checkedProfessionColor, "border-transparent")
          : "bg-white border-border"
      )}
      aria-pressed={checked}
    >
      {checked ? (
        <Check className="h-5 w-5 text-foreground" strokeWidth={2.5} />
      ) : null}
    </button>
  );
}
