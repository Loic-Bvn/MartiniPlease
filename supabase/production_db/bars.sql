create table public.bars (
  id uuid not null default gen_random_uuid (),
  name text not null,
  owner_id uuid not null,
  invite_code text not null,
  created_at timestamp with time zone null default now(),
  is_public boolean not null default false,
  status text not null default 'pending'::text,
  features jsonb not null default '{"order": true, "share": true}'::jsonb,
  statistics jsonb null,
  constraint bars_pkey primary key (id),
  constraint bars_invite_code_key unique (invite_code),
  constraint bars_owner_id_fkey foreign KEY (owner_id) references auth.users (id) on delete CASCADE,
  constraint bars_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'approved'::text,
          'rejected'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_bars_status on public.bars using btree (status) TABLESPACE pg_default;

create trigger trg_set_invite_code BEFORE INSERT on bars for EACH row
execute FUNCTION set_invite_code ();

create trigger validate_inscription
after INSERT on bars for EACH row
execute FUNCTION supabase_functions.http_request (
  'https://weeilvuklsxiqtljnyok.supabase.co/functions/v1/notify-new-bar',
  'POST',
  '{"Content-type":"application/json"}',
  '{}',
  '5000'
);