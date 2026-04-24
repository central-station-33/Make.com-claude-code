-- ============================================================
-- The Wire — Database Schema
-- Run this migration in your Supabase SQL editor to enable
-- all Wire features and the Retool API.
-- ============================================================

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ── wire_contacts ───────────────────────────────────────────
create table if not exists public.wire_contacts (
  id            uuid primary key default uuid_generate_v4(),
  first_name    text not null,
  last_name     text not null,
  email         text,
  phone         text,
  address       text,
  city          text,
  state         text,
  zip           text,
  tags          text[] default '{}',
  source        text,
  assigned_to   text,
  do_not_contact boolean not null default false,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  last_activity timestamptz
);

create index if not exists wire_contacts_email_idx on public.wire_contacts (email);
create index if not exists wire_contacts_phone_idx on public.wire_contacts (phone);
create index if not exists wire_contacts_tags_idx on public.wire_contacts using gin (tags);
create index if not exists wire_contacts_created_at_idx on public.wire_contacts (created_at desc);

-- ── wire_pipelines ──────────────────────────────────────────
create table if not exists public.wire_pipelines (
  id         uuid primary key default uuid_generate_v4(),
  name       text not null,
  created_at timestamptz not null default now()
);

-- ── wire_pipeline_stages ────────────────────────────────────
create table if not exists public.wire_pipeline_stages (
  id          uuid primary key default uuid_generate_v4(),
  pipeline_id uuid not null references public.wire_pipelines (id) on delete cascade,
  name        text not null,
  position    integer not null default 0,
  color       text not null default '#6B7280'
);

-- ── wire_conversations ──────────────────────────────────────
create table if not exists public.wire_conversations (
  id              uuid primary key default uuid_generate_v4(),
  contact_id      uuid not null references public.wire_contacts (id) on delete cascade,
  channel         text not null check (channel in ('sms','email','call','note')),
  status          text not null default 'open' check (status in ('open','closed','unread')),
  subject         text,
  last_message    text,
  last_message_at timestamptz,
  assigned_to     text,
  unread_count    integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists wire_conversations_contact_idx on public.wire_conversations (contact_id);
create index if not exists wire_conversations_status_idx on public.wire_conversations (status);
create index if not exists wire_conversations_last_msg_idx on public.wire_conversations (last_message_at desc);

-- ── wire_messages ───────────────────────────────────────────
create table if not exists public.wire_messages (
  id              uuid primary key default uuid_generate_v4(),
  conversation_id uuid not null references public.wire_conversations (id) on delete cascade,
  direction       text not null check (direction in ('inbound','outbound')),
  channel         text not null check (channel in ('sms','email','call','note')),
  body            text not null,
  from_address    text,
  to_address      text,
  status          text not null default 'sent' check (status in ('sent','delivered','failed','received')),
  created_at      timestamptz not null default now()
);

create index if not exists wire_messages_conv_idx on public.wire_messages (conversation_id, created_at);

-- ── wire_opportunities ──────────────────────────────────────
create table if not exists public.wire_opportunities (
  id          uuid primary key default uuid_generate_v4(),
  pipeline_id uuid not null references public.wire_pipelines (id) on delete cascade,
  stage_id    uuid not null references public.wire_pipeline_stages (id),
  contact_id  uuid not null references public.wire_contacts (id) on delete cascade,
  name        text not null,
  value       numeric(12,2),
  status      text not null default 'open' check (status in ('open','won','lost','abandoned')),
  assigned_to text,
  close_date  date,
  notes       text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists wire_opportunities_pipeline_idx on public.wire_opportunities (pipeline_id, stage_id);
create index if not exists wire_opportunities_status_idx on public.wire_opportunities (status);

-- ── wire_appointments ───────────────────────────────────────
create table if not exists public.wire_appointments (
  id           uuid primary key default uuid_generate_v4(),
  contact_id   uuid not null references public.wire_contacts (id) on delete cascade,
  title        text not null,
  description  text,
  start_time   timestamptz not null,
  end_time     timestamptz not null,
  status       text not null default 'scheduled'
               check (status in ('scheduled','confirmed','cancelled','completed','no_show')),
  assigned_to  text,
  location     text,
  meeting_link text,
  created_at   timestamptz not null default now()
);

create index if not exists wire_appointments_start_idx on public.wire_appointments (start_time);
create index if not exists wire_appointments_contact_idx on public.wire_appointments (contact_id);

-- ── wire_automations ────────────────────────────────────────
create table if not exists public.wire_automations (
  id              uuid primary key default uuid_generate_v4(),
  name            text not null,
  description     text,
  status          text not null default 'draft'
                  check (status in ('active','paused','draft')),
  trigger_type    text not null,
  steps           jsonb not null default '[]',
  enrolled_count  integer not null default 0,
  completed_count integer not null default 0,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

-- ── wire_campaigns ──────────────────────────────────────────
create table if not exists public.wire_campaigns (
  id               uuid primary key default uuid_generate_v4(),
  name             text not null,
  type             text not null check (type in ('email','sms')),
  status           text not null default 'draft'
                   check (status in ('draft','scheduled','active','paused','completed')),
  subject          text,
  body             text not null,
  recipient_count  integer not null default 0,
  sent_count       integer not null default 0,
  open_count       integer not null default 0,
  click_count      integer not null default 0,
  scheduled_at     timestamptz,
  sent_at          timestamptz,
  created_at       timestamptz not null default now()
);

-- ── Row Level Security ──────────────────────────────────────
-- All Wire tables are accessible to authenticated users.
-- The wire-api edge function uses the service_role key and bypasses RLS.

alter table public.wire_contacts enable row level security;
alter table public.wire_pipelines enable row level security;
alter table public.wire_pipeline_stages enable row level security;
alter table public.wire_conversations enable row level security;
alter table public.wire_messages enable row level security;
alter table public.wire_opportunities enable row level security;
alter table public.wire_appointments enable row level security;
alter table public.wire_automations enable row level security;
alter table public.wire_campaigns enable row level security;

-- Authenticated users can read and write all Wire data
create policy "wire_authenticated_all" on public.wire_contacts
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "wire_authenticated_all" on public.wire_pipelines
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "wire_authenticated_all" on public.wire_pipeline_stages
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "wire_authenticated_all" on public.wire_conversations
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "wire_authenticated_all" on public.wire_messages
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "wire_authenticated_all" on public.wire_opportunities
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "wire_authenticated_all" on public.wire_appointments
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "wire_authenticated_all" on public.wire_automations
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

create policy "wire_authenticated_all" on public.wire_campaigns
  for all using (auth.role() = 'authenticated') with check (auth.role() = 'authenticated');

-- ── Seed default pipeline ───────────────────────────────────
insert into public.wire_pipelines (id, name)
values ('00000000-0000-0000-0000-000000000001', 'Main Sales Pipeline')
on conflict (id) do nothing;

insert into public.wire_pipeline_stages (pipeline_id, name, position, color) values
  ('00000000-0000-0000-0000-000000000001', 'New Lead',        0, '#6B7280'),
  ('00000000-0000-0000-0000-000000000001', 'Contacted',       1, '#3B82F6'),
  ('00000000-0000-0000-0000-000000000001', 'Appointment Set', 2, '#8B5CF6'),
  ('00000000-0000-0000-0000-000000000001', 'Offer Made',      3, '#F59E0B'),
  ('00000000-0000-0000-0000-000000000001', 'Under Contract',  4, '#10B981'),
  ('00000000-0000-0000-0000-000000000001', 'Closed',          5, '#EAB308')
on conflict do nothing;
