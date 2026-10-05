create table public.cocktails_catalog (
  id uuid not null default extensions.uuid_generate_v4 (),
  name text null,
  base_spirit text null,
  category text null,
  glass text null,
  method text null,
  abv text null,
  description_fr text null,
  profile jsonb null,
  season jsonb null,
  image text null,
  tags jsonb null,
  recipe jsonb null,
  created_at timestamp with time zone null,
  cocktail_style text null,
  ice text null,
  description_en text null,
  creation_year text null,
  creator text null,
  submitted_by_bar_id uuid null,
  price numeric null,
  constraint cocktails_catalog_DEBUG_pkey primary key (id),
  constraint cocktails_catalog_profile_valid check (
    (
      (profile is null)
      or (
        (jsonb_typeof(profile) = 'array'::text)
        and (
          profile <@ '["smoky", "bitter", "creamy", "tropical", "floral", "nutty", "spicy", "herbal", "fruity", "citrus", "sour", "dry", "boozy", "refreshing", "rich", "sweet"]'::jsonb
        )
        and (jsonb_array_length(profile) <= 3)
      )
    )
  ),
  constraint cocktails_catalog_style_valid check (
    (
      (cocktail_style is null)
      or (
        cocktail_style = any (
          array[
            'sour'::text,
            'spirit_forward'::text,
            'highball'::text,
            'fizz'::text,
            'smash'::text,
            'tiki'::text,
            'spritz'::text,
            'creamy'::text,
            'punch'::text,
            'hot'::text,
            'shot'::text,
            'frozen'::text
          ]
        )
      )
    )
  ),
  constraint cocktails_catalog_glass_valid check (
    (glass is null)
    or glass = any (array[
      'rocks', 'coupe', 'martini', 'highball', 'nick_nora',
      'champagne_flute', 'wine', 'shot', 'tiki', 'copper_mug'
    ]::text[])
  ),
  constraint cocktails_catalog_ice_valid check (
    ice is null
    or ice = any (array['cubed', 'crushed', 'clear', 'no_ice']::text[])
  )
) TABLESPACE pg_default;