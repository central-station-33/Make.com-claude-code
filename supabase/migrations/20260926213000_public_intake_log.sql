-- 20260926-02: log for the public-lead-intake Edge Function (website forms).
-- Used for rate limiting and spam auditing. Stores only one-way hashes of the
-- visitor IP and contact (phone/email), never the raw values. Service role only.
create table if not exists public.public_intake_log (
  id           bigserial primary key,
  created_at   timestamptz not null default now(),
  form         text,
  ip_hash      text,
  contact_hash text,
  outcome      text not null,          -- accepted | honeypot | too_fast | rate_limited | invalid | bad_origin | forward_failed
  detail       text
);
create index if not exists public_intake_log_ip_idx      on public.public_intake_log (ip_hash, created_at desc);
create index if not exists public_intake_log_contact_idx on public.public_intake_log (contact_hash, created_at desc);
alter table public.public_intake_log enable row level security;
revoke all on table public.public_intake_log from anon, authenticated;
revoke all on sequence public.public_intake_log_id_seq from anon, authenticated;
comment on table public.public_intake_log is 'public-lead-intake spam/rate-limit log (hashed IP/contact only). Service role only; no RLS policies on purpose.';
