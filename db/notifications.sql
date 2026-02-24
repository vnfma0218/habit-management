-- Web Push notification subscriptions (Supabase)
create extension if not exists pgcrypto;

create table if not exists public.notification_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  timezone text not null default 'Asia/Seoul',
  reminder_time text not null default '20:00',
  is_enabled boolean not null default true,
  last_sent_date text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists notification_subscriptions_user_id_idx
  on public.notification_subscriptions(user_id);

create index if not exists notification_subscriptions_schedule_idx
  on public.notification_subscriptions(is_enabled, reminder_time, timezone);

alter table public.notification_subscriptions enable row level security;

drop policy if exists "notification_subscriptions_select_own"
  on public.notification_subscriptions;
create policy "notification_subscriptions_select_own"
  on public.notification_subscriptions
  for select
  using (auth.uid() = user_id);

drop policy if exists "notification_subscriptions_insert_own"
  on public.notification_subscriptions;
create policy "notification_subscriptions_insert_own"
  on public.notification_subscriptions
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "notification_subscriptions_update_own"
  on public.notification_subscriptions;
create policy "notification_subscriptions_update_own"
  on public.notification_subscriptions
  for update
  using (auth.uid() = user_id);

drop policy if exists "notification_subscriptions_delete_own"
  on public.notification_subscriptions;
create policy "notification_subscriptions_delete_own"
  on public.notification_subscriptions
  for delete
  using (auth.uid() = user_id);


-- ㅅㄷㄴㅅㄷㄴㅅ