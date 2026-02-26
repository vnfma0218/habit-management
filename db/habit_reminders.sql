alter table public.habits
  add column if not exists reminder_enabled boolean not null default false,
  add column if not exists reminder_time text,
  add column if not exists last_reminded_date text;

create index if not exists habits_reminder_idx
  on public.habits(user_id, reminder_enabled, reminder_time, is_active);
