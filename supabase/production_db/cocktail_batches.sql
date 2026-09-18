create table public.cocktail_batches (
  id uuid not null default gen_random_uuid (),
  bar_id uuid not null,
  cocktail_id uuid not null,
  name text null,
  servings integer not null,
  dilution_percent numeric not null default 20,
  created_at timestamp with time zone null default now(),
  constraint cocktail_batches_pkey primary key (id),
  constraint cocktail_batches_bar_id_fkey foreign KEY (bar_id) references bars (id) on delete CASCADE,
  constraint cocktail_batches_cocktail_id_fkey foreign KEY (cocktail_id) references bar_cocktails_bis (id) on delete CASCADE,
  constraint cocktail_batches_dilution_percent_check check ((dilution_percent >= (0)::numeric)),
  constraint cocktail_batches_servings_check check ((servings > 0))
) TABLESPACE pg_default;

create index IF not exists idx_cocktail_batches_bar_id on public.cocktail_batches using btree (bar_id) TABLESPACE pg_default;