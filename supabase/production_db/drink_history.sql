create table public.drink_history (
  id uuid not null default gen_random_uuid (),
  drinker_id uuid not null,
  cocktail_id uuid not null,
  bar_id uuid not null,
  ordered_at timestamp with time zone null default now(),
  constraint drink_history_pkey primary key (id),
  constraint drink_history_bar_id_fkey foreign KEY (bar_id) references bars (id) on delete CASCADE,
  constraint drink_history_cocktail_id_fkey foreign KEY (cocktail_id) references bar_cocktails_bis (id) on delete CASCADE,
  constraint drink_history_drinker_id_fkey foreign KEY (drinker_id) references drinker_profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_history_drinker on public.drink_history using btree (drinker_id) TABLESPACE pg_default;