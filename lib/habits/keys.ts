export const habitKeys = {
  all: ["habits"] as const,
  today: ["habits", "today"] as const,
  weekly: ["habits", "weekly"] as const,
  overallMonth: (month: string) => ["habits", "overall", "month", month] as const,
  overallDay: (date: string) => ["habits", "overall", "day", date] as const,
  overallWeeklyGoals: ["habits", "overall", "weekly-goals"] as const,
};
