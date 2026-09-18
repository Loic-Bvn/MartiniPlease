create table public.drinker_profiles (
  id uuid not null default gen_random_uuid (),
  bar_id uuid not null,
  pseudo text not null,
  created_at timestamp with time zone null default now(),
  token uuid null default gen_random_uuid (),
  constraint drinker_profiles_pkey primary key (id),
  constraint drinker_profiles_token_key unique (token),
  constraint unique_pseudo_per_bar unique (pseudo, bar_id),
  constraint drinker_profiles_bar_id_fkey foreign KEY (bar_id) references bars (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_drinker_profiles_bar on public.drinker_profiles using btree (bar_id) TABLESPACE pg_default;

create index IF not exists idx_drinker_token on public.drinker_profiles using btree (token) TABLESPACE pg_default;