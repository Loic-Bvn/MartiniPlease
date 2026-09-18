create table public.drinker_favorites (
  id uuid not null default gen_random_uuid (),
  drinker_id uuid not null,
  cocktail_id uuid not null,
  bar_id uuid not null,
  created_at timestamp with time zone null default now(),
  constraint drinker_favorites_pkey primary key (id),
  constraint drinker_favorites_drinker_id_cocktail_id_key unique (drinker_id, cocktail_id),
  constraint drinker_favorites_bar_id_fkey foreign KEY (bar_id) references bars (id) on delete CASCADE,
  constraint drinker_favorites_cocktail_id_fkey foreign KEY (cocktail_id) references bar_cocktails_bis (id) on delete CASCADE,
  constraint drinker_favorites_drinker_id_fkey foreign KEY (drinker_id) references drinker_profiles (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_favorites_drinker on public.drinker_favorites using btree (drinker_id) TABLESPACE pg_default;

create index IF not exists idx_favorites_cocktail on public.drinker_favorites using btree (cocktail_id) TABLESPACE pg_default;