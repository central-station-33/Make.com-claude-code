-- F50SEO Automation: content queue and settings tables

create table if not exists public.content_queue (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  scheduled_for   date not null default current_date,
  status          text not null default 'pending'
                    check (status in ('pending','approved','published','rejected')),
  content_type    text not null
                    check (content_type in ('blog-post','linkedin','twitter','facebook','instagram')),
  title           text,
  body            text not null,
  meta_description text,
  tags            text[],
  platform_data   jsonb default '{}',
  published_at    timestamptz,
  published_url   text,
  agent_run_id    uuid,
  brand           text,
  topic           text,
  audience        text,
  rejection_note  text
);

create index if not exists content_queue_status_idx      on public.content_queue (status);
create index if not exists content_queue_scheduled_idx   on public.content_queue (scheduled_for desc);
create index if not exists content_queue_agent_run_idx   on public.content_queue (agent_run_id);

alter table public.content_queue enable row level security;
drop policy if exists "authenticated users manage content_queue" on public.content_queue;
create policy "authenticated users manage content_queue"
  on public.content_queue for all
  to authenticated using (true) with check (true);


create table if not exists public.automation_settings (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid references auth.users on delete cascade,
  brand_name            text not null default '',
  target_topic          text not null default '',
  target_audience       text not null default '',
  wordpress_url         text not null default '',
  wordpress_username    text not null default '',
  wordpress_app_password text not null default '',
  make_webhook_url      text not null default '',
  schedule_hour         int not null default 8
                          check (schedule_hour between 0 and 23),
  auto_publish_blog     boolean not null default false,
  auto_publish_social   boolean not null default false,
  active                boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create unique index if not exists automation_settings_user_idx
  on public.automation_settings (user_id);

alter table public.automation_settings enable row level security;
drop policy if exists "users manage own settings" on public.automation_settings;
create policy "users manage own settings"
  on public.automation_settings for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
