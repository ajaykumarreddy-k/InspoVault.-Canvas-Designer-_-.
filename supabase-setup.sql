-- ═══════════════════════════════════════════════════════════════
-- VAULT — SUPABASE SETUP SQL
-- Run this entire file in: Supabase Dashboard → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════


-- ── 1. ITEMS TABLE (vault saved content) ────────────────────────
create table if not exists public.items (
  id            uuid primary key default gen_random_uuid(),
  type          text not null,
  folder        text not null,
  title         text,
  content       text,
  notes         text,
  drive_file_id text,
  created_at    timestamptz default now()
);

alter table public.items enable row level security;

create policy "items: service role full access"
  on public.items for all
  using (true) with check (true);


-- ── 2. CANVAS STATE TABLE (positions of all canvas nodes) ────────
create table if not exists public.canvas_state (
  user_id    text primary key,
  nodes      text not null default '[]',
  updated_at timestamptz default now()
);

alter table public.canvas_state enable row level security;

create policy "canvas: service role full access"
  on public.canvas_state for all
  using (true) with check (true);


-- ── 3. EMAIL WHITELIST TABLE ─────────────────────────────────────
create table if not exists public.allowed_emails (
  email      text primary key,
  name       text,
  added_at   timestamptz default now()
);

-- Insert your whitelisted Google accounts
insert into public.allowed_emails (email, name) values
  ('ajaykumarreddykrishnareddygari@gmail.com', 'Ajay Kumar Reddy'),
  ('k.ajaykumarreddy26@gmail.com',             'Ajay 26'),
  ('ajayapiuser2@gmail.com',                   'Ajay API'),
  ('ajayphotos26@gmail.com',                   'Ajay Photos')
on conflict (email) do nothing;


-- ── 4. WHITELIST TRIGGER — blocks unauthorized Google sign-ins ───
-- This fires BEFORE a new user row is created in auth.users.
-- If the email is not in allowed_emails, the sign-in is aborted.

create or replace function public.enforce_email_whitelist()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.allowed_emails
    where lower(email) = lower(new.email)
  ) then
    raise exception
      'Access denied: % is not authorized to use this application.', new.email;
  end if;
  return new;
end;
$$;

-- Attach trigger to auth.users (Supabase's internal auth table)
drop trigger if exists check_whitelist_on_signup on auth.users;

create trigger check_whitelist_on_signup
  before insert on auth.users
  for each row
  execute function public.enforce_email_whitelist();


-- ── 5. HELPER FUNCTION — frontend can call this to verify a session ──
-- Usage: supabase.rpc('is_email_allowed', { check_email: 'user@gmail.com' })

create or replace function public.is_email_allowed(check_email text)
returns boolean
language sql
security definer
as $$
  select exists (
    select 1 from public.allowed_emails
    where lower(email) = lower(check_email)
  );
$$;


-- ── 6. CANVAS RLS — only load/save your own canvas (future auth) ─
-- For now, service role bypasses RLS. When auth is active, switch to:
-- using (user_id = auth.uid()::text) with check (user_id = auth.uid()::text);
-- ──────────────────────────────────────────────────────────────────

