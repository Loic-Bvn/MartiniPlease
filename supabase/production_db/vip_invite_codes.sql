create table public.vip_invite_codes (
  id uuid not null default gen_random_uuid (),
  code text not null,
  note text null,
  max_uses integer null,
  uses_count integer not null default 0,
  active boolean not null default true,
  expires_at timestamp with time zone null,
  created_at timestamp with time zone null default now(),
  constraint vip_invite_codes_pkey primary key (id),
  constraint vip_invite_codes_code_key unique (code)
) TABLESPACE pg_default;