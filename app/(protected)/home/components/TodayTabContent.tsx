"use client";

import { useMemo, useState } from "react";
import { Check, GripVertical, RotateCcw, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from "@dnd-kit/core";

import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";

import { CSS } from "@dnd-kit/utilities";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

/* =========================
 * Types (DB 스키마 기반)
 * ========================= */
export type HabitTime = "morning" | "afternoon" | "evening";

export type TodayHabitDTO = {
  id: string;
  name: string;
  goal: string | null;
  weekly_target: number;
  time_slot: HabitTime;
  time_text: string | null;
  icon: string;
  color: string;
  order_in_time: number;
  is_active: boolean;
  done: boolean; // ✅ habit_logs merge 결과
  log_date: string; // ✅ YYYY-MM-DD (서버가 내려줌)
};

const TIME_LABEL: Record<HabitTime, string> = {
  morning: "오전 ☀️",
  afternoon: "오후 🌤",
  evening: "저녁 🌙",
};

const TIME_ORDER: HabitTime[] = ["morning", "afternoon", "evening"];
const EXCLUDED_STORAGE_PREFIX = "today_excluded:";

/* =========================
 * React Query Keys
 * ========================= */
const habitKeys = {
  today: (userId: string, date?: string) =>
    ["habits", "today", userId, date ?? "today"] as const,
};

/* =========================
 * API functions (Route Handler 호출)
 * ========================= */
async function fetchTodayHabits(params: {
  userId: string;
  date?: string; // YYYY-MM-DD
}): Promise<TodayHabitDTO[]> {
  const q = new URLSearchParams({ userId: params.userId });
  if (params.date) q.set("date", params.date);

  const res = await fetch(`/api/habits/today?${q.toString()}`, {
    method: "GET",
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to fetch habits");
  return json.habits as TodayHabitDTO[];
}

async function patchHabitDone(params: {
  userId: string;
  habitId: string;
  done: boolean;
  log_date: string; // YYYY-MM-DD
}) {
  const res = await fetch(`/api/habits/${params.habitId}/done`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      userId: params.userId,
      done: params.done,
      log_date: params.log_date,
    }),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to update done");
  return json.log as { habit_id: string; is_done: boolean; log_date: string };
}

async function postReorder(params: {
  userId: string;
  items: Array<{ id: string; time_slot: HabitTime; order_in_time: number }>;
}) {
  const res = await fetch(`/api/habits/reorder`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? "Failed to reorder");
  return json as { ok: true };
}

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function getExcludedKey(dateKey: string) {
  return `${EXCLUDED_STORAGE_PREFIX}${dateKey}`;
}

function readExcludedIds(dateKey: string) {
  if (typeof window === "undefined") return new Set<string>();
  try {
    const raw = localStorage.getItem(getExcludedKey(dateKey));
    if (!raw) return new Set<string>();
    const parsed = JSON.parse(raw) as string[];
    if (!Array.isArray(parsed)) return new Set<string>();
    return new Set(parsed);
  } catch {
    return new Set<string>();
  }
}

function writeExcludedIds(dateKey: string, ids: Set<string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    getExcludedKey(dateKey),
    JSON.stringify(Array.from(ids))
  );
}

/* =========================
 * UI helpers
 * ========================= */
function TimeDivider({ label }: { label: string }) {
  return (
    <div className="relative my-4 flex items-center">
      <div className="h-px flex-1 bg-slate-200" />
      <span className="mx-3 text-xs font-medium text-slate-500">{label}</span>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

function ExcludeButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "h-8 w-8 shrink-0 rounded-lg grid place-items-center",
        "border border-slate-900/10 bg-white/60 text-slate-700",
        "hover:bg-white"
      )}
      aria-label="오늘 제외"
      title="오늘 제외"
    >
      <EyeOff className="h-4 w-4" />
    </button>
  );
}

function RestoreButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-8 w-8 shrink-0 rounded-lg inline-flex items-center justify-center",
        "border border-slate-900/10 bg-white/70 text-slate-700",
        "hover:bg-white"
      )}
      aria-label="루틴 복구"
      title="복구"
    >
      <RotateCcw className="h-4 w-4" />
    </button>
  );
}

/** ✅ 체크 토글은 오른쪽 버튼만 */
function CheckButton({
  done,
  onClick,
}: {
  done: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={cn(
        "h-8 w-8 shrink-0 rounded-full grid place-items-center",
        "border border-slate-900/10 bg-white/60",
        done ? "opacity-100" : "opacity-50 hover:opacity-70"
      )}
      aria-label={done ? "완료" : "미완료"}
    >
      {done ? (
        <Check className="h-4 w-4 text-slate-900" />
      ) : (
        <div className="h-4 w-4 rounded-full border border-slate-900/25" />
      )}
    </button>
  );
}

/** ✅ Sortable Row */
function SortableHabitRow({
  habit,
  onToggleDone,
  onExclude,
}: {
  habit: TodayHabitDTO;
  onToggleDone: (id: string, nextDone: boolean, log_date: string) => void;
  onExclude: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: habit.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <div
        style={{ backgroundColor: habit.color }}
        className={cn(
          "w-full rounded-2xl px-4 py-3 text-left",
          "flex items-center gap-3",
          "border border-black/5",
          "transition active:scale-[0.99]",
          isDragging && "opacity-60"
        )}
      >
        {/* drag handle */}
        <button
          type="button"
          className="touch-none h-10 w-8 shrink-0 grid place-items-center rounded-xl bg-white/40"
          {...attributes}
          {...listeners}
          aria-label="순서 변경"
        >
          <GripVertical className="h-4 w-4 text-slate-700" />
        </button>

        {/* icon */}
        <div className="h-10 w-10 shrink-0 rounded-xl bg-white/60 grid place-items-center text-xl">
          {habit.icon}
        </div>

        {/* name */}
        <div className="min-w-0 flex-1">
          <div className="truncate text-[15px] font-medium text-slate-900">
            {habit.name}
          </div>
          {habit.time_text ? (
            <div className="mt-0.5 truncate text-xs text-slate-600">
              {habit.time_text}
            </div>
          ) : null}
          {habit.goal ? (
            <div className="mt-0.5 truncate text-xs text-slate-700/90">
              목표: {habit.goal}
            </div>
          ) : null}
        </div>

        {/* check */}
        <CheckButton
          done={habit.done}
          onClick={() => onToggleDone(habit.id, !habit.done, habit.log_date)}
        />
        <ExcludeButton onClick={() => onExclude(habit.id)} />
      </div>
    </div>
  );
}

function ExcludedHabitRow({
  habit,
  onRestore,
}: {
  habit: TodayHabitDTO;
  onRestore: (id: string) => void;
}) {
  return (
    <div
      style={{ backgroundColor: habit.color }}
      className={cn(
        "w-full rounded-2xl px-4 py-3 text-left",
        "flex items-center gap-3",
        "border border-black/5 opacity-90"
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
        {habit.goal ? (
          <div className="mt-0.5 truncate text-xs text-slate-700/90">
            목표: {habit.goal}
          </div>
        ) : null}
      </div>
      <RestoreButton onClick={() => onRestore(habit.id)} />
    </div>
  );
}

function OverlayRow({ habit }: { habit: TodayHabitDTO }) {
  return (
    <div
      className={cn(
        "w-[min(520px,calc(100vw-2rem))] rounded-2xl px-4 py-3",
        "flex items-center gap-3",
        "border border-black/10 shadow-lg",
        habit.color
      )}
    >
      <div className="h-10 w-8 shrink-0 grid place-items-center rounded-xl bg-white/40">
        <GripVertical className="h-4 w-4 text-slate-700" />
      </div>
      <div className="h-10 w-10 shrink-0 rounded-xl bg-white/60 grid place-items-center text-xl">
        {habit.icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[15px] font-medium text-slate-900">
          {habit.name}
        </div>
      </div>
      <div className="h-8 w-8 shrink-0 rounded-full border border-slate-900/10 bg-white/60" />
    </div>
  );
}

/* =========================
 * Main Component
 * ========================= */
export function TodayTabContent({
  userId,
  date, // 선택: YYYY-MM-DD
}: {
  userId: string;
  date?: string;
}) {
  const qc = useQueryClient();
  const [activeId, setActiveId] = useState<string | null>(null);
  const todayKey = date ?? toISODate(new Date());
  const [excludedState, setExcludedState] = useState<{
    dateKey: string;
    ids: Set<string>;
  }>(() => ({
    dateKey: todayKey,
    ids: readExcludedIds(todayKey),
  }));

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 8 },
    })
  );

  // ✅ Query: 오늘 루틴 + done(log) merge 데이터
  const {
    data: habits = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: habitKeys.today(userId, date),
    queryFn: () => fetchTodayHabits({ userId, date }),
  });

  const excludedIds =
    excludedState.dateKey === todayKey
      ? excludedState.ids
      : readExcludedIds(todayKey);

  const excludeHabitForToday = (habitId: string) => {
    setExcludedState((prev) => {
      const base =
        prev.dateKey === todayKey ? prev.ids : readExcludedIds(todayKey);
      if (base.has(habitId)) return { dateKey: todayKey, ids: base };
      const next = new Set(base);
      next.add(habitId);
      writeExcludedIds(todayKey, next);
      return { dateKey: todayKey, ids: next };
    });
  };

  const restoreHabitForToday = (habitId: string) => {
    setExcludedState((prev) => {
      const base =
        prev.dateKey === todayKey ? prev.ids : readExcludedIds(todayKey);
      if (!base.has(habitId)) return { dateKey: todayKey, ids: base };
      const next = new Set(base);
      next.delete(habitId);
      writeExcludedIds(todayKey, next);
      return { dateKey: todayKey, ids: next };
    });
  };

  const habitsById = useMemo(() => {
    const m = new Map<string, TodayHabitDTO>();
    habits.forEach((h) => m.set(h.id, h));
    return m;
  }, [habits]);

  const grouped = useMemo(() => {
    const g: Record<HabitTime, TodayHabitDTO[]> = {
      morning: [],
      afternoon: [],
      evening: [],
    };
    for (const h of habits) {
      if (excludedIds.has(h.id)) continue;
      g[h.time_slot].push(h);
    }
    for (const t of TIME_ORDER)
      g[t].sort((a, b) => a.order_in_time - b.order_in_time);
    return g;
  }, [habits, excludedIds]);

  const excludedHabits = useMemo(
    () =>
      habits
        .filter((h) => excludedIds.has(h.id))
        .sort((a, b) => {
          if (a.time_slot === b.time_slot) {
            return a.order_in_time - b.order_in_time;
          }
          return (
            TIME_ORDER.indexOf(a.time_slot) - TIME_ORDER.indexOf(b.time_slot)
          );
        }),
    [habits, excludedIds]
  );

  const visibleHabits = useMemo(
    () => habits.filter((h) => !excludedIds.has(h.id)),
    [habits, excludedIds]
  );

  const completed = useMemo(
    () => visibleHabits.filter((h) => h.done).length,
    [visibleHabits]
  );

  // ✅ done 토글: 낙관적 업데이트
  const toggleDoneMut = useMutation({
    mutationFn: (p: { habitId: string; done: boolean; log_date: string }) =>
      patchHabitDone({ userId, ...p }),
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: habitKeys.today(userId, date) });

      const prev = qc.getQueryData<TodayHabitDTO[]>(
        habitKeys.today(userId, date)
      );
      if (!prev) return { prev };

      qc.setQueryData<TodayHabitDTO[]>(habitKeys.today(userId, date), (old) => {
        if (!old) return old;
        return old.map((h) =>
          h.id === vars.habitId ? { ...h, done: vars.done } : h
        );
      });

      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(habitKeys.today(userId, date), ctx.prev);
      toast.error(err instanceof Error ? err.message : "완료 처리 실패");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: habitKeys.today(userId, date) });
    },
  });

  // ✅ reorder: 낙관적 업데이트
  const reorderMut = useMutation({
    mutationFn: (
      items: Array<{ id: string; time_slot: HabitTime; order_in_time: number }>
    ) => postReorder({ userId, items }),
    onMutate: async (items) => {
      await qc.cancelQueries({ queryKey: habitKeys.today(userId, date) });

      const prev = qc.getQueryData<TodayHabitDTO[]>(
        habitKeys.today(userId, date)
      );
      if (!prev) return { prev };

      const map = new Map(items.map((it) => [it.id, it]));
      qc.setQueryData<TodayHabitDTO[]>(habitKeys.today(userId, date), (old) => {
        if (!old) return old;
        return old.map((h) => {
          const it = map.get(h.id);
          return it
            ? { ...h, time_slot: it.time_slot, order_in_time: it.order_in_time }
            : h;
        });
      });

      return { prev };
    },
    onError: (err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(habitKeys.today(userId, date), ctx.prev);
      toast.error(err instanceof Error ? err.message : "순서 저장 실패");
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: habitKeys.today(userId, date) });
    },
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeHabit = habitsById.get(String(active.id));
    const overHabit = habitsById.get(String(over.id));
    if (!activeHabit || !overHabit) return;

    // ✅ 같은 시간대에서만 reorder 허용
    if (activeHabit.time_slot !== overHabit.time_slot) return;

    const time = activeHabit.time_slot;
    const list = grouped[time];

    const oldIndex = list.findIndex((h) => h.id === activeHabit.id);
    const newIndex = list.findIndex((h) => h.id === overHabit.id);
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;

    // ✅ 새 순서를 10,20,30… 부여
    const moved = arrayMove(list, oldIndex, newIndex).map((h, idx) => ({
      id: h.id,
      time_slot: time,
      order_in_time: (idx + 1) * 10,
    }));

    reorderMut.mutate(moved);
  };

  const activeHabit = activeId ? habitsById.get(activeId) : null;

  if (isLoading) {
    return <div className="text-sm text-slate-500">불러오는 중…</div>;
  }

  if (isError) {
    return <div className="text-sm text-red-600">불러오기 실패</div>;
  }

  return (
    <div className="w-full">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <div className="text-lg font-semibold text-slate-900">오늘 루틴</div>
          <div className="mt-1 text-sm text-slate-600">
            완료 {completed} / {visibleHabits.length}
          </div>
          {visibleHabits.length > 0 && completed === visibleHabits.length ? (
            <div className="mt-2 text-sm font-medium text-emerald-700">
              오늘 루틴을 모두 완료했어요! 🎉👏
            </div>
          ) : null}
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(e) => setActiveId(String(e.active.id))}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveId(null)}
      >
        <div className="flex flex-col gap-3">
          {TIME_ORDER.map((time) => {
            const items = grouped[time];
            if (items.length === 0) return null;

            return (
              <div key={time}>
                <TimeDivider label={TIME_LABEL[time]} />

                <SortableContext
                  items={items.map((h) => h.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex flex-col gap-3">
                    {items.map((habit) => (
                      <SortableHabitRow
                        key={habit.id}
                        habit={habit}
                        onExclude={excludeHabitForToday}
                        onToggleDone={(id, nextDone, log_date) =>
                          toggleDoneMut.mutate({
                            habitId: id,
                            done: nextDone,
                            log_date,
                          })
                        }
                      />
                    ))}
                  </div>
                </SortableContext>
              </div>
            );
          })}
        </div>

        <DragOverlay>
          {activeHabit ? <OverlayRow habit={activeHabit} /> : null}
        </DragOverlay>
      </DndContext>

      {excludedHabits.length > 0 ? (
        <div className="mt-6">
          <TimeDivider label="오늘 제외한 루틴" />
          <div className="flex flex-col gap-3">
            {excludedHabits.map((habit) => (
              <ExcludedHabitRow
                key={habit.id}
                habit={habit}
                onRestore={restoreHabitForToday}
              />
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
