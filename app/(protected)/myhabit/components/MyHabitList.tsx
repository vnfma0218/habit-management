import { HabitTime, TodayHabitDTO } from "@/lib/habits/api";
import { cn } from "@/lib/utils";
import Link from "next/link";

const TIME_LABEL: Record<HabitTime, string> = {
  morning: "오전 ☀️",
  afternoon: "오후 🌤",
  evening: "저녁 🌙",
};

const TIME_ORDER: HabitTime[] = ["morning", "afternoon", "evening"];

function TimeDivider({ label }: { label: string }) {
  return (
    <div className="relative my-4 flex items-center">
      <div className="h-px flex-1 bg-slate-200" />
      <span className="mx-3 text-xs font-medium text-slate-500">{label}</span>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

function HabitRow({ habit }: { habit: TodayHabitDTO }) {
  return (
    <Link href={`/myHabit/${habit.id}`} className="block">
      <div
        style={{ backgroundColor: habit.color }}
        className={cn(
          "w-full rounded-2xl px-4 py-3 text-left",
          "flex items-center gap-3",
          "border border-black/5 transition hover:opacity-90 active:scale-[0.99]"
        )}
      >
        <div className="h-10 w-10 shrink-0 rounded-xl bg-white/60 grid place-items-center text-xl">
          {habit.icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-medium text-slate-900">
            {habit.name}
          </div>
          {habit.time_text ? (
            <div className="mt-0.5 truncate text-xs text-slate-600">
              {habit.time_text}
            </div>
          ) : null}
        </div>

        <div className="text-slate-700/70 text-sm">›</div>
      </div>
    </Link>
  );
}

export function MyHabitList({ habits }: { habits: TodayHabitDTO[] }) {
  const grouped: Record<HabitTime, TodayHabitDTO[]> = {
    morning: [],
    afternoon: [],
    evening: [],
  };

  for (const h of habits) grouped[h.time_slot].push(h);
  for (const t of TIME_ORDER) {
    grouped[t].sort((a, b) => a.order_in_time - b.order_in_time);
  }

  return (
    <div className="w-full">
      {habits.length === 0 ? (
        <div className="text-sm text-slate-500">표시할 루틴이 없습니다.</div>
      ) : null}
      <div className="flex flex-col gap-3">
        {TIME_ORDER.map((time) => {
          const items = grouped[time];
          if (items.length === 0) return null;

          return (
            <div key={time}>
              <TimeDivider label={TIME_LABEL[time]} />
              <div className="flex flex-col gap-3">
                {items.map((habit) => (
                  <HabitRow key={habit.id} habit={habit} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
