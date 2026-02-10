"use client";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { PASTEL_COLORS } from "@/lib/color";
import { Clock2Icon } from "lucide-react";
import { useState } from "react";
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

export default function New() {
  const [selectedIcon, setSelectedIcon] = useState<string>("💧");
  const [selectedColor, setSelectedColor] = useState("#FFD6E5");
  const [repeatDays, setRepeatDays] = useState<number | null>(null);

  return (
    <div>
      <FieldGroup className="gap-7 sm:gap-4">
        <Field>
          <FieldLabel htmlFor="name">이름</FieldLabel>
          <Input id="name" placeholder="ex) 하루에 물 5번 먹기" />
        </Field>
        <Field>
          <FieldLabel htmlFor="repeat">반복</FieldLabel>

          <p className="mb-2 text-sm text-zinc-700 dark:text-zinc-300">
            {repeatDays ? `일주일에 ${repeatDays}회` : "일주일에 몇 회 할까요?"}
          </p>

          <div className="flex gap-2">
            {[1, 2, 3, 4, 5, 6, 7].map((day) => {
              const isSelected = repeatDays === day;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setRepeatDays(day)}
                  className={[
                    "h-10 w-10 rounded-full border text-sm font-medium",
                    "flex items-center justify-center transition-colors",
                    isSelected
                      ? "bg-primary text-white border-primary"
                      : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-100",
                  ].join(" ")}
                  aria-pressed={isSelected}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {/* 서버 제출용 */}
          <input type="hidden" name="repeatDays" value={repeatDays ?? ""} />
        </Field>

        <Field>
          <FieldLabel htmlFor="time">시간</FieldLabel>
          <Input id="time" placeholder="ex) 잠자기 전, 일어난 직후" />
        </Field>
        <Field>
          <FieldLabel htmlFor="icon">아이콘</FieldLabel>

          {/* ✅ 가로 스크롤 아이콘 리스트 */}
          <div
            className="flex gap-2 overflow-x-auto pb-2"
            style={{ WebkitOverflowScrolling: "touch" }}
            aria-label="아이콘 선택"
          >
            {DEFAULT_ICONS.map((icon) => {
              const isSelected = selectedIcon === icon;
              return (
                <button
                  key={icon}
                  type="button"
                  onClick={() => setSelectedIcon(icon)}
                  className={[
                    "shrink-0 h-12 w-12 rounded-xl border text-2xl",
                    "flex items-center justify-center",
                    "transition-colors",
                    isSelected
                      ? "border-primary bg-primary/10"
                      : "border-border bg-background hover:bg-muted",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  ].join(" ")}
                  aria-pressed={isSelected}
                  aria-label={`아이콘 ${icon} 선택`}
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
              const isSelected = selectedColor === c.hex;

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setSelectedColor(c.hex)}
                  className="shrink-0"
                  aria-pressed={isSelected}
                  aria-label={`색상 ${c.hex} 선택`}
                >
                  <div
                    className={[
                      "relative h-10 w-10 rounded-full border",
                      "flex items-center justify-center",
                      "transition-transform hover:scale-105",
                      isSelected ? "border-black" : "border-border",
                    ].join(" ")}
                    style={{ backgroundColor: c.hex }}
                  >
                    {isSelected && (
                      <span className="text-black font-bold text-lg leading-none">
                        ✓
                      </span>
                    )}
                  </div>
                </button>
              );
            })}

            {/* 폼 제출용 hidden 값 */}
            <input type="hidden" name="color" value={selectedColor} />
          </div>
        </Field>

        <Field orientation="horizontal">
          <Button type="reset" variant="outline">
            Reset
          </Button>
          <Button type="submit">Submit</Button>
        </Field>
      </FieldGroup>
    </div>
  );
}
