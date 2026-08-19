update bar_cocktails_debug_debug_DEBUG
set recipe = (
  select jsonb_agg(
    (elem - 'Ingredient' - 'Type') || jsonb_build_object('Ingredient', elem->'Type')
  )
  from jsonb_array_elements(recipe) elem
)
where recipe is not null and recipe != '[]'::jsonb;

-- même chose sur cocktails_catalog_debug_debug
update cocktails_catalog_debug_debug_DEBUG
set recipe = (
  select jsonb_agg(
    (elem - 'Ingredient' - 'Type') || jsonb_build_object('Ingredient', elem->'Type')
  )
  from jsonb_array_elements(recipe) elem
)
where recipe is not null and recipe != '[]'::jsonb;