"use client";

import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PASTEL_COLORS } from "@/lib/color";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const DEFAULT_ICONS = [
  "🏃",
  "🚶",
  "🧘",
  "🛌",
  "💧",
  "🥗",
  "🏋️",
  "🧍",
  "📚",
  "✍️",
  "🎧",
  "💻",
  "🧠",
  "📝",
  "☀️",
  "🌙",
  "🧹",
  "🗑️",
  "🛒",
  "📅",
  "💛",
  "😊",
  "🤝",
  "📞",
  "🌿",
  "🎵",
  "🎯",
  "✅",
  "📖",
  "📊",
  "⏰",
  "📌",
];

type TimePreset = "morning" | "afternoon" | "evening" | null;

const TIME_PRESETS: { key: Exclude<TimePreset, null>; label: string }[] = [
  { key: "morning", label: "오전" },
  { key: "afternoon", label: "오후" },
  { key: "evening", label: "저녁" },
];

type HabitEditInitial = {
  id: string;
  name: string;
  goal: string | null;
  weekly_target: number;
  time_slot: "morning" | "afternoon" | "evening";
  time_text: string | null;
  icon: string;
  color: string;
};

export function HabitEditForm({ initial }: { initial: HabitEditInitial }) {
  const router = useRouter();

  const [name, setName] = useState(initial.name);
  const [goal, setGoal] = useState(initial.goal ?? "");

  const [selectedIcon, setSelectedIcon] = useState<string>(initial.icon);
  const [selectedColor, setSelectedColor] = useState(initial.color);
  const [repeatDays, setRepeatDays] = useState<number | null>(
    initial.weekly_target
  );

  const [timePreset, setTimePreset] = useState<TimePreset>(initial.time_slot);
  const [timeText, setTimeText] = useState(initial.time_text ?? "");
  const [submitting, setSubmitting] = useState(false);

  const toggleTimePreset = (key: TimePreset) => {
    setTimePreset((prev) => (prev === key ? null : key));
  };
  const isSelected = (key: TimePreset) => timePreset === key;

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error("이름을 입력해주세요.");
    if (!repeatDays) return toast.error("반복 횟수를 선택해주세요.");
    if (!timePreset) return toast.error("시간대를 선택해주세요.");
    if (!selectedIcon) return toast.error("아이콘을 선택해주세요.");
    if (!selectedColor) return toast.error("색상을 선택해주세요.");

    setSubmitting(true);
    try {
      const res = await fetch(`/api/habits/${initial.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          weekly_target: repeatDays,
          time_slot: timePreset,
          time_text: timeText.trim(),
          goal: goal.trim(),
          icon: selectedIcon,
          color: selectedColor,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "수정에 실패했습니다.");

      toast.success("루틴이 수정되었습니다.");
      router.push("/myhabit");
      router.refresh();
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "수정 중 오류가 발생했습니다.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit}>
      <FieldGroup className="gap-7 sm:gap-4">
        <Field>
          <FieldLabel htmlFor="name">이름</FieldLabel>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            id="name"
            placeholder="ex) 하루에 물 5번 먹기"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="repeat">반복</FieldLabel>
          <p className="mb-2 text-sm text-zinc-700 dark:text-zinc-300">
            {repeatDays ? `일주일에 ${repeatDays}회` : "일주일에 몇 회 할까요?"}
          </p>

          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => {
              const selected = repeatDays === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setRepeatDays(day)}
                  className={[
                    "h-10 w-10 rounded-full border text-sm font-medium border-zinc-200",
                    "flex items-center justify-center transition-colors",
                    selected
                      ? "bg-main text-white"
                      : "bg-white text-zinc-700 hover:bg-zinc-100",
                  ].join(" ")}
                  aria-pressed={selected}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <input type="hidden" name="repeatDays" value={repeatDays ?? ""} />
        </Field>

        <Field>
          <FieldLabel htmlFor="time">시간</FieldLabel>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <div className="flex flex-wrap gap-2">
              {TIME_PRESETS.map((p) => (
                <Button
                  key={p.key}
                  type="button"
                  onClick={() => toggleTimePreset(p.key)}
                  variant={isSelected(p.key) ? "primary" : "outline"}
                >
                  {p.label}
                </Button>
              ))}
            </div>
            <Input
              id="time"
              placeholder="ex) 잠자기 전, 일어난 직후"
              value={timeText}
              onChange={(e) => setTimeText(e.target.value)}
              className="w-full sm:flex-1"
            />
          </div>
        </Field>

        <Field>
          <FieldLabel htmlFor="goal">목표</FieldLabel>
          <Input
            id="goal"
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="ex) 달리기 5분, 명상 1분 등"
          />
        </Field>

        <Field>
          <FieldLabel htmlFor="icon">아이콘</FieldLabel>
          <div
            className="flex gap-2 overflow-x-auto pb-2"
            style={{ WebkitOverflowScrolling: "touch" }}
            aria-label="아이콘 선택"
          >
            {DEFAULT_ICONS.map((icon) => {
              const selected = selectedIcon === icon;
              return (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={[
                    "shrink-0 h-12 w-12 rounded-xl border text-2xl",
                    "flex items-center justify-center",
                    "transition-colors",
                    selected
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background hover:bg-muted",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  ].join(" ")}
                  aria-pressed={selected}
                >
                  {icon}
                </button>
              );
            })}
          </div>
        </Field>

        <Field>
          <FieldLabel htmlFor="color">색상</FieldLabel>
          <div className="mt-2 flex gap-3 flex-wrap">
            {PASTEL_COLORS.map((c) => {
              const selected = selectedColor === c.hex;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedColor(c.hex)}
                  className="shrink-0"
                  aria-pressed={selected}
                >
                  <div
                    className={[
                      "relative h-10 w-10 rounded-full border",
                      "flex items-center justify-center",
                      "transition-transform hover:scale-105",
                      selected ? "border-black" : "border-border",
                    ].join(" ")}
                    style={{ backgroundColor: c.hex }}
                  >
                    {selected ? (
                      <span className="text-black font-bold text-lg leading-none">
                        ✓
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
            <input type="hidden" name="color" value={selectedColor} />
          </div>
        </Field>

        <Field orientation="horizontal">
          <Button
            variant="primary"
            type="submit"
            className="w-full"
            disabled={submitting}
          >
            {submitting ? "저장 중..." : "루틴 수정하기"}
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
