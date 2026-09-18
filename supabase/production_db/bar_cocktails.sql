create table public.bar_cocktails (
  id uuid not null default extensions.uuid_generate_v4 (),
  recipe jsonb not null default '[]'::jsonb,
  created_at timestamp with time zone null default now(),
  bar_id uuid null,
  name text null,
  catalog_id uuid null,
  is_private boolean null default false,
  submitted_by_bar_id text null,
  base_spirit text null,
  category text null,
  method text null,
  abv text null,
  description_fr text null,
  description_en text null,
  profile jsonb null,
  season jsonb null,
  image text null,
  tags jsonb null,
  creation_year text null,
  creator text null,
  cocktail_style text null,
  ice text null,
  glass text null,
  price numeric null,
  constraint bar_cocktails_DEBUG_pkey primary key (id),
  constraint bar_cocktails_DEBUG_cocktail_catalog_id_bar_id_key unique (catalog_id, bar_id),
  constraint bar_cocktails_DEBUG_bar_id_fkey foreign KEY (bar_id) references bars (id) on delete CASCADE,
  constraint bar_cocktails_DEBUG_catalog_id_fkey foreign KEY (catalog_id) references cocktails_catalog_bis (id),
  constraint bar_cocktails_price_check check (
    (
      (price is null)
      or (price >= (0)::numeric)
    )
  )
) TABLESPACE pg_default;

create index IF not exists "bar_cocktails_DEBUG_cocktail_catalog_id_idx" on public.bar_cocktails using btree (catalog_id) TABLESPACE pg_default;

create index IF not exists "bar_cocktails_DEBUG_bar_id_idx" on public.bar_cocktails using btree (bar_id) TABLESPACE pg_default;