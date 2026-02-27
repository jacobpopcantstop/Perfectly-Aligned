-- Perfectly Aligned premium/auth/history schema
-- Run this in Supabase SQL Editor for your project.

-- Entitlements: one row per auth user/profile
create table if not exists public.entitlements (
    profile_id uuid primary key references auth.users(id) on delete cascade,
    is_premium boolean not null default false,
    source text not null default 'free',
    effective_from timestamptz not null default now(),
    effective_to timestamptz null,
    updated_at timestamptz not null default now()
);

create index if not exists entitlements_is_premium_idx
    on public.entitlements (is_premium);

create index if not exists entitlements_updated_at_idx
    on public.entitlements (updated_at desc);

-- Game session history
create table if not exists public.game_sessions (
    id uuid primary key,
    host_profile_id uuid not null references auth.users(id) on delete cascade,
    room_code text not null,
    mode text not null check (mode in ('online', 'offline')),
    selected_decks jsonb not null default '[]'::jsonb,
    modifiers_enabled boolean not null default true,
    started_at timestamptz not null,
    ended_at timestamptz null,
    winner_player_name text null,
    summary jsonb not null default '{}'::jsonb
);

create index if not exists game_sessions_host_started_idx
    on public.game_sessions (host_profile_id, started_at desc);

create index if not exists game_sessions_started_idx
    on public.game_sessions (started_at desc);

-- Per-player final stats for each session
create table if not exists public.game_session_players (
    id bigint generated always as identity primary key,
    game_session_id uuid not null references public.game_sessions(id) on delete cascade,
    player_name text not null,
    avatar text null,
    final_score integer not null default 0,
    final_tokens jsonb not null default '{}'::jsonb
);

create index if not exists game_session_players_session_idx
    on public.game_session_players (game_session_id);

-- Optional hardening: lock down direct client access and keep writes server-side.
alter table public.entitlements enable row level security;
alter table public.game_sessions enable row level security;
alter table public.game_session_players enable row level security;

-- Read-only policies for authenticated users on their own data.
do $$
begin
    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'entitlements'
          and policyname = 'Users can read own entitlements'
    ) then
        create policy "Users can read own entitlements"
            on public.entitlements
            for select
            to authenticated
            using (auth.uid() = profile_id);
    end if;

    if not exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename = 'game_sessions'
          and policyname = 'Users can read own game sessions'
    ) then
        create policy "Users can read own game sessions"
            on public.game_sessions
            for select
            to authenticated
            using (auth.uid() = host_profile_id);
    end if;
end $$;
