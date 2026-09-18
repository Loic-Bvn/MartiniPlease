create table public.ingredients (
  id uuid not null default extensions.uuid_generate_v4 (),
  name text not null,
  type text not null,
  category text not null,
  available boolean null default false,
  created_at timestamp with time zone null default now(),
  abv real null,
  family text null,
  bar_id uuid null,
  pricing_mode text not null default 'bottle'::text,
  bottle_price numeric null,
  bottle_volume_ml numeric not null default 700,
  price_per_ml numeric null,
  "references" jsonb not null default '[]'::jsonb,
  base_type_key text null,
  constraint ingredients_pkey primary key (id),
  constraint ingredients_type_bar_unique unique (type, bar_id),
  constraint ingredients_base_type_key_fkey foreign KEY (base_type_key) references ingredient_types (key) on delete set null,
  constraint ingredients_bar_id_fkey foreign KEY (bar_id) references bars (id) on delete CASCADE,
  constraint ingredients_bottle_price_check check (
    (
      (bottle_price is null)
      or (bottle_price >= (0)::numeric)
    )
  ),
  constraint ingredients_bottle_volume_ml_check check ((bottle_volume_ml > (0)::numeric)),
  constraint ingredients_price_per_ml_check check (
    (
      (price_per_ml is null)
      or (price_per_ml >= (0)::numeric)
    )
  ),
  constraint ingredients_pricing_mode_check check (
    (
      pricing_mode = any (array['bottle'::text, 'ml'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_ingredients_bar_id on public.ingredients using btree (bar_id) TABLESPACE pg_default;

create index IF not exists idx_ingredients_base_type_key on public.ingredients using btree (base_type_key) TABLESPACE pg_default;

create trigger trg_set_ingredient_base_type_key BEFORE INSERT
or
update OF type on ingredients for EACH row
execute FUNCTION set_ingredient_base_type_key ();