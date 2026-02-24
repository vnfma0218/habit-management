"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import {
  fetchOverallDay,
  fetchOverallMonth,
  fetchOverallWeeklyGoals,
  OverallDayHabitDTO,
} from "@/lib/habits/api";
import { habitKeys } from "@/lib/habits/keys";

const WEEKDAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const TIME_LABEL: Record<"morning" | "afternoon" | "evening", string> = {
  morning: "오전 ☀️",
  afternoon: "오후 🌤",
  evening: "저녁 🌙",
};

function levelClass(level: number) {
  if (level <= 0) return "bg-slate-100";
  if (level === 1) return "bg-emerald-100";
  if (level === 2) return "bg-emerald-200";
  if (level === 3) return "bg-emerald-300";
  return "bg-emerald-500";
}

function shiftMonth(date: Date, delta: number) {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

function addDays(date: Date, days: number) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function mondayIndex(date: Date) {
  return (date.getDay() + 6) % 7; // Mon=0 ... Sun=6
}

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function toMonthString(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}`;
}

function toDateString(date: Date) {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function formatDateLabel(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  const weekdays = ["일", "월", "화", "수", "목", "금", "토"];
  return `${year}.${pad2(month)}.${pad2(day)} (${weekdays[date.getDay()]})`;
}

function buildMonthCells(currentMonth: Date, levelByDate: Map<string, number>) {
  const firstDay = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth(),
    1
  );
  const lastDay = new Date(
    currentMonth.getFullYear(),
    currentMonth.getMonth() + 1,
    0
  );

  const start = addDays(firstDay, -mondayIndex(firstDay));
  const end = addDays(lastDay, 6 - mondayIndex(lastDay));

  const cells: Array<{ date: Date; inCurrentMonth: boolean; level: number }> = [];
  for (let cursor = start; cursor <= end; cursor = addDays(cursor, 1)) {
    const inCurrentMonth = cursor.getMonth() === currentMonth.getMonth();
    const dateString = toDateString(cursor);
    cells.push({
      date: cursor,
      inCurrentMonth,
      level: inCurrentMonth ? (levelByDate.get(dateString) ?? 0) : 0,
    });
  }

  return cells;
}

export function OverallTabContent() {
  const [currentMonth, setCurrentMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const monthString = useMemo(() => toMonthString(currentMonth), [currentMonth]);

  const {
    data: monthData,
    isLoading: isMonthLoading,
    isError: isMonthError,
  } = useQuery({
    queryKey: habitKeys.overallMonth(monthString),
    queryFn: () => fetchOverallMonth(monthString),
  });

  const levelByDate = useMemo(() => {
    const map = new Map<string, number>();
    for (const day of monthData?.days ?? []) {
      map.set(day.date, day.level);
    }
    return map;
  }, [monthData]);

  const monthCells = useMemo(
    () => buildMonthCells(currentMonth, levelByDate),
    [currentMonth, levelByDate]
  );

  const {
    data: dayData,
    isLoading: isDayLoading,
    isError: isDayError,
  } = useQuery({
    queryKey: habitKeys.overallDay(selectedDate ?? ""),
    queryFn: () => fetchOverallDay(selectedDate!),
    enabled: Boolean(selectedDate),
  });

  const {
    data: weeklyGoalData,
    isLoading: isWeeklyGoalLoading,
    isError: isWeeklyGoalError,
  } = useQuery({
    queryKey: habitKeys.overallWeeklyGoals,
    queryFn: fetchOverallWeeklyGoals,
  });

  const completedHabits = useMemo(
    () => (dayData?.habits ?? []).filter((habit) => habit.done),
    [dayData]
  );
  const pendingHabits = useMemo(
    () => (dayData?.habits ?? []).filter((habit) => !habit.done),
    [dayData]
  );

  const streakHabits = useMemo(
    () => (weeklyGoalData?.habits ?? []).filter((habit) => habit.streakWeeks > 0),
    [weeklyGoalData]
  );

  return (
    <div className="space-y-4">
      <Card className="border bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">루틴 연속 달성</CardTitle>
        </CardHeader>
        <CardContent>
          {isWeeklyGoalLoading ? (
            <div className="text-sm text-slate-500">연속 달성 데이터를 불러오는 중...</div>
          ) : null}
          {isWeeklyGoalError ? (
            <div className="text-sm text-red-600">연속 달성 데이터 로드에 실패했습니다.</div>
          ) : null}

          {!isWeeklyGoalLoading && !isWeeklyGoalError ? (
            <>
              {streakHabits.length === 0 ? (
                <div className="text-sm text-slate-500">연속 달성 중인 루틴이 없습니다.</div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {streakHabits.map((habit) => (
                    <div
                      key={habit.id}
                      className="rounded-xl border border-black/5 bg-emerald-50 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-900">
                          <span>{habit.icon}</span>
                          <span className="truncate">{habit.name}</span>
                        </div>
                        <span className="text-xs text-emerald-700">
                          {habit.currentAchieved ? "이번 주 달성" : "진행 중"}
                        </span>
                      </div>
                      <div className="mt-2 text-lg font-semibold text-emerald-700">
                        {habit.streakWeeks}주 연속
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : null}
        </CardContent>
      </Card>

      <Card className="border bg-white/90 shadow-sm">
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">월간 달성 캘린더</CardTitle>
          <div className="inline-flex items-center gap-1">
            <button
              type="button"
              onClick={() => setCurrentMonth((prev) => shiftMonth(prev, -1))}
              className="h-8 w-8 rounded-md border border-slate-200 grid place-items-center hover:bg-slate-50"
              aria-label="이전 달"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setCurrentMonth((prev) => shiftMonth(prev, 1))}
              className="h-8 w-8 rounded-md border border-slate-200 grid place-items-center hover:bg-slate-50"
              aria-label="다음 달"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-3 text-sm font-medium text-slate-700">
            {currentMonth.getFullYear()}년 {currentMonth.getMonth() + 1}월
          </div>

          <div className="mb-2 grid grid-cols-7 gap-2 text-[11px] text-slate-500">
            {WEEKDAY_LABELS.map((label) => (
              <div key={label} className="text-center">
                {label}
              </div>
            ))}
          </div>

          {isMonthLoading ? (
            <div className="mb-3 text-xs text-slate-500">캘린더 데이터를 불러오는 중...</div>
          ) : null}
          {isMonthError ? (
            <div className="mb-3 text-xs text-red-600">월간 데이터 로드에 실패했습니다.</div>
          ) : null}

          <div className="grid grid-cols-7 gap-2 sm:gap-3">
            {monthCells.map((cell) => (
              <button
                type="button"
                key={`${cell.date.getFullYear()}-${cell.date.getMonth()}-${cell.date.getDate()}`}
                onClick={() => setSelectedDate(toDateString(cell.date))}
                className={cn(
                  "aspect-square rounded-md border border-black/5 p-1",
                  levelClass(cell.level),
                  !cell.inCurrentMonth && "opacity-35",
                  selectedDate === toDateString(cell.date) && "ring-2 ring-emerald-500"
                )}
                aria-label={`${toDateString(cell.date)} 상세 보기`}
              >
                <div className="text-[10px] text-slate-700">{cell.date.getDate()}</div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedDate ? (
        <Card className="border bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">
              {formatDateLabel(selectedDate)} 상세
            </CardTitle>
            {dayData ? (
              <p className="text-sm text-slate-600">
                완료 {dayData.completed}/{dayData.total} ({dayData.rate}%)
              </p>
            ) : null}
          </CardHeader>
          <CardContent className="space-y-4">
            {isDayLoading ? (
              <div className="text-sm text-slate-500">상세 데이터를 불러오는 중...</div>
            ) : null}
            {isDayError ? (
              <div className="text-sm text-red-600">상세 데이터 로드에 실패했습니다.</div>
            ) : null}

            {!isDayLoading && !isDayError ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <HabitListBlock title="완료한 루틴" habits={completedHabits} />
                <HabitListBlock title="못한 루틴" habits={pendingHabits} />
              </div>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      <Card className="border bg-white/90 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">주간 목표 달성률</CardTitle>
          {weeklyGoalData ? (
            <p className="text-xs text-slate-500">
              {weeklyGoalData.periodStart} ~ {weeklyGoalData.periodEnd}
            </p>
          ) : null}
        </CardHeader>
        <CardContent className="space-y-3">
          {isWeeklyGoalLoading ? (
            <div className="text-sm text-slate-500">주간 목표 데이터를 불러오는 중...</div>
          ) : null}
          {isWeeklyGoalError ? (
            <div className="text-sm text-red-600">주간 목표 데이터 로드에 실패했습니다.</div>
          ) : null}

          {!isWeeklyGoalLoading && !isWeeklyGoalError ? (
            <>
              {(weeklyGoalData?.habits ?? []).length === 0 ? (
                <div className="text-sm text-slate-500">활성 루틴이 없습니다.</div>
              ) : null}

              {(weeklyGoalData?.habits ?? []).map((item) => {
                const rate = Math.min(100, item.rate);
                return (
                  <div key={item.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span className="inline-flex items-center gap-1.5">
                        <span>{item.icon}</span>
                        <span>{item.name}</span>
                      </span>
                      <span>
                        {item.completed}/{item.target}회 ({item.rate}%)
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-emerald-400"
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </>
          ) : null}
          <p className="text-xs text-slate-500">
            이번 주(월~일) 완료 횟수 기준으로 계산됩니다.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function HabitListBlock({
  title,
  habits,
}: {
  title: string;
  habits: OverallDayHabitDTO[];
}) {
  return (
    <div>
      <div className="mb-2 text-sm font-medium text-slate-700">{title}</div>
      {habits.length === 0 ? (
        <div className="rounded-lg border border-slate-200 p-3 text-xs text-slate-500">
          루틴이 없습니다.
        </div>
      ) : (
        <div className="space-y-2">
          {habits.map((habit) => (
            <div
              key={habit.id}
              className="rounded-lg border border-black/5 p-3"
              style={{ backgroundColor: habit.color }}
            >
              <div className="flex items-center gap-2">
                <span>{habit.icon}</span>
                <span className="text-sm font-medium text-slate-900">{habit.name}</span>
              </div>
              <div className="mt-1 text-xs text-slate-700">
                {TIME_LABEL[habit.time_slot]}
                {habit.time_text ? ` · ${habit.time_text}` : ""}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
