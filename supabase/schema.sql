-- SolidDesign Phase-1 operational schema.
-- Server-side only initially: no anon/authenticated access is granted.
-- Apply only to a dedicated SolidDesign Supabase project.

create extension if not exists pgcrypto;

create table if not exists public.prospects (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  name text not null,
  category text,
  city text,
  address text,
  website_url text not null,
  phone text,
  rating numeric(3,2),
  review_count integer,
  place_id text,
  state text not null default 'DISCOVERED',
  qualification jsonb,
  verified_facts jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.audits (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  source text not null,
  source_version text,
  score integer,
  grade text,
  findings jsonb not null default '[]'::jsonb,
  screenshot_ref text,
  created_at timestamptz not null default now()
);

create table if not exists public.demos (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  site_config jsonb not null,
  preview_url text,
  status text not null default 'DRAFT',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.mailings (
  id uuid primary key default gen_random_uuid(),
  prospect_id uuid not null references public.prospects(id) on delete cascade,
  demo_id uuid references public.demos(id) on delete set null,
  status text not null default 'PREPARED',
  mailed_at timestamptz,
  response_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.events (
  id bigint generated always as identity primary key,
  prospect_id uuid references public.prospects(id) on delete cascade,
  demo_id uuid references public.demos(id) on delete cascade,
  event_type text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audits_prospect_id_idx on public.audits(prospect_id);
create index if not exists demos_prospect_id_idx on public.demos(prospect_id);
create index if not exists mailings_prospect_id_idx on public.mailings(prospect_id);
create index if not exists mailings_demo_id_idx on public.mailings(demo_id);
create index if not exists events_prospect_id_created_at_idx on public.events(prospect_id, created_at desc);
create index if not exists events_demo_id_idx on public.events(demo_id);

alter table public.prospects enable row level security;
alter table public.audits enable row level security;
alter table public.demos enable row level security;
alter table public.mailings enable row level security;
alter table public.events enable row level security;

revoke all on table public.prospects from anon, authenticated;
revoke all on table public.audits from anon, authenticated;
revoke all on table public.demos from anon, authenticated;
revoke all on table public.mailings from anon, authenticated;
revoke all on table public.events from anon, authenticated;

grant select, insert, update, delete on table public.prospects to service_role;
grant select, insert, update, delete on table public.audits to service_role;
grant select, insert, update, delete on table public.demos to service_role;
grant select, insert, update, delete on table public.mailings to service_role;
grant select, insert, update, delete on table public.events to service_role;
grant usage, select on sequence public.events_id_seq to service_role;
