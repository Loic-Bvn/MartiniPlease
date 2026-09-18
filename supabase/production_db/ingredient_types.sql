create table public.ingredient_types (
  key text not null,
  name text not null,
  category text not null,
  family text null,
  abv real null,
  pricing_mode text not null default 'bottle'::text,
  bottle_volume_ml numeric not null default 700,
  bottle_price numeric null,
  price_per_ml numeric null,
  created_at timestamp with time zone not null default now(),
  constraint ingredient_types_pkey primary key (key),
  constraint ingredient_types_bottle_price_check check (
    (
      (bottle_price is null)
      or (bottle_price >= (0)::numeric)
    )
  ),
  constraint ingredient_types_bottle_volume_ml_check check ((bottle_volume_ml > (0)::numeric)),
  constraint ingredient_types_category_check check (
    (
      category = any (
        array[
          'spirits'::text,
          'licors'::text,
          'modifiers'::text,
          'juices'::text,
          'syrups'::text,
          'bitters'::text,
          'mixers'::text,
          'garnish'::text,
          'others'::text
        ]
      )
    )
  ),
  constraint ingredient_types_price_per_ml_check check (
    (
      (price_per_ml is null)
      or (price_per_ml >= (0)::numeric)
    )
  ),
  constraint ingredient_types_pricing_mode_check check (
    (
      pricing_mode = any (array['bottle'::text, 'ml'::text])
    )
  )
) TABLESPACE pg_default;