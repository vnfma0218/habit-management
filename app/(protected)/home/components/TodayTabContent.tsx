"use client";

import { useMemo, useState } from "react";
import { Check, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

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

type HabitTime = "morning" | "afternoon" | "evening";

type Habit = {
  id: string;
  name: string;
  icon: string;
  bg: string;
  done: boolean;
  time: HabitTime;
  order: number; // ✅ 시간대 내부 order
};

const TIME_LABEL: Record<HabitTime, string> = {
  morning: "오전 ☀️",
  afternoon: "오후 🌤",
  evening: "저녁 🌙",
};

const TIME_ORDER: HabitTime[] = ["morning", "afternoon", "evening"];

const MOCK_HABITS: Habit[] = [
  {
    id: "1",
    name: "물 2L 마시기",
    icon: "💧",
    bg: "bg-sky-100",
    done: false,
    time: "morning",
    order: 10,
  },
  {
    id: "2",
    name: "10분 스트레칭",
    icon: "🧘",
    bg: "bg-emerald-100",
    done: true,
    time: "morning",
    order: 20,
  },
  {
    id: "12",
    name: "헬스장가기",
    icon: "🧘",
    bg: "bg-[#FFD8BE]",
    done: true,
    time: "morning",
    order: 30,
  },
  {
    id: "3",
    name: "30분 산책",
    icon: "🚶",
    bg: "bg-amber-100",
    done: false,
    time: "afternoon",
    order: 10,
  },
  {
    id: "4",
    name: "독서 20분",
    icon: "📚",
    bg: "bg-violet-100",
    done: false,
    time: "evening",
    order: 10,
  },
];

function TimeDivider({ label }: { label: string }) {
  return (
    <div className="relative my-4 flex items-center">
      <div className="h-px flex-1 bg-slate-200" />
      <span className="mx-3 text-xs font-medium text-slate-500">{label}</span>
      <div className="h-px flex-1 bg-slate-200" />
    </div>
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
}: {
  habit: Habit;
  onToggleDone: (id: string) => void;
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
        className={cn(
          "w-full rounded-2xl px-4 py-3 text-left",
          "flex items-center gap-3",
          "border border-black/5",
          "transition active:scale-[0.99]",
          habit.bg,
          isDragging && "opacity-60"
        )}
      >
        {/* drag handle (모바일에서도 잡기 좋게) */}
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
        </div>

        {/* check */}
        <CheckButton done={habit.done} onClick={() => onToggleDone(habit.id)} />
      </div>
    </div>
  );
}

function OverlayRow({ habit }: { habit: Habit }) {
  return (
    <div
      className={cn(
        "w-[min(520px,calc(100vw-2rem))] rounded-2xl px-4 py-3",
        "flex items-center gap-3",
        "border border-black/10 shadow-lg",
        habit.bg
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

export function TodayTabContent() {
  const [habits, setHabits] = useState<Habit[]>(MOCK_HABITS);
  const [activeId, setActiveId] = useState<string | null>(null);

  // ✅ 모바일 포함 센서 세팅
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 }, // 살짝 움직여야 드래그 시작
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 8 }, // 롱프레스 느낌(모바일)
    })
  );

  const habitsById = useMemo(() => {
    const m = new Map<string, Habit>();
    habits.forEach((h) => m.set(h.id, h));
    return m;
  }, [habits]);

  const grouped = useMemo(() => {
    const g: Record<HabitTime, Habit[]> = {
      morning: [],
      afternoon: [],
      evening: [],
    };
    for (const h of habits) g[h.time].push(h);
    for (const t of TIME_ORDER) g[t].sort((a, b) => a.order - b.order);
    return g;
  }, [habits]);

  const completed = useMemo(
    () => habits.filter((h) => h.done).length,
    [habits]
  );

  const onToggleDone = (id: string) => {
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, done: !h.done } : h))
    );
  };

  const normalizeOrders = (time: HabitTime, list: Habit[]) => {
    // order를 10,20,30…로 재부여 (삽입/이동에 강함)
    const next = list.map((h, idx) => ({ ...h, order: (idx + 1) * 10 }));
    setHabits((prev) => {
      const rest = prev.filter((h) => h.time !== time);
      return [...rest, ...next];
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeHabit = habitsById.get(String(active.id));
    const overHabit = habitsById.get(String(over.id));
    if (!activeHabit || !overHabit) return;

    // ✅ 같은 시간대에서만 reorder 허용
    if (activeHabit.time !== overHabit.time) return;

    const time = activeHabit.time;
    const list = grouped[time];
    const oldIndex = list.findIndex((h) => h.id === activeHabit.id);
    const newIndex = list.findIndex((h) => h.id === overHabit.id);
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) return;

    const moved = arrayMove(list, oldIndex, newIndex);
    normalizeOrders(time, moved);
  };

  const activeHabit = activeId ? habitsById.get(activeId) : null;

  return (
    <div className="w-full">
      <div className="mb-4 flex items-end justify-between">
        <div>
          <div className="text-lg font-semibold text-slate-900">오늘 루틴</div>
          <div className="mt-1 text-sm text-slate-600">
            완료 {completed} / {habits.length}
          </div>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={(e) => {
          console.log("start");
          setActiveId(String(e.active.id));
        }}
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

                {/* ✅ 섹션별 SortableContext: “그 그룹 내부 정렬” */}
                <SortableContext
                  items={items.map((h) => h.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="flex flex-col gap-3">
                    {items.map((habit) => (
                      <SortableHabitRow
                        key={habit.id}
                        habit={habit}
                        onToggleDone={onToggleDone}
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
    </div>
  );
}
