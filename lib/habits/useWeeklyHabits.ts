"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchWeeklyHabits } from "@/lib/habits/api";
import { habitKeys } from "@/lib/habits/keys";

export function useWeeklyHabits() {
  return useQuery({
    queryKey: habitKeys.weekly,
    queryFn: fetchWeeklyHabits,
  });
}
