-- Cocktail preparation counter. Run this script in the Supabase SQL editor.

create table if not exists public.preparation_log (
  id uuid primary key default gen_random_uuid(),
  bar_id uuid not null references public.bars (id) on delete cascade,
  cocktail_id uuid not null references public.bar_cocktails (id) on delete cascade,
  card_id uuid references public.menu_cards (id) on delete set null,
  quantity integer not null default 1 check (quantity between 1 and 50),
  prepared_at timestamptz not null default now()
);

create index if not exists preparation_log_bar_prepared_at_idx
  on public.preparation_log (bar_id, prepared_at desc);
create index if not exists preparation_log_bar_cocktail_idx
  on public.preparation_log (bar_id, cocktail_id);
create index if not exists preparation_log_bar_card_idx
  on public.preparation_log (bar_id, card_id);

alter table public.preparation_log enable row level security;

drop policy if exists "Bar owners can read preparations" on public.preparation_log;
create policy "Bar owners can read preparations"
  on public.preparation_log for select to authenticated
  using (exists (
    select 1 from public.bars b
    where b.id = preparation_log.bar_id and b.owner_id = auth.uid()
  ));

drop policy if exists "Bar owners can log preparations" on public.preparation_log;
create policy "Bar owners can log preparations"
  on public.preparation_log for insert to authenticated
  with check (
    exists (
      select 1 from public.bars b
      where b.id = preparation_log.bar_id and b.owner_id = auth.uid()
    )
    and exists (
      select 1 from public.bar_cocktails c
      where c.id = preparation_log.cocktail_id and c.bar_id = preparation_log.bar_id
    )
    and (
      preparation_log.card_id is null
      or exists (
        select 1 from public.menu_cards mc
        where mc.id = preparation_log.card_id
          and mc.bar_id = preparation_log.bar_id
          and preparation_log.cocktail_id = any(mc.cocktail_ids)
      )
    )
  );

drop policy if exists "Bar owners can delete preparations" on public.preparation_log;
create policy "Bar owners can delete preparations"
  on public.preparation_log for delete to authenticated
  using (exists (
    select 1 from public.bars b
    where b.id = preparation_log.bar_id and b.owner_id = auth.uid()
  ));

grant select, insert, delete on public.preparation_log to authenticated;
revoke all on public.preparation_log from anon;

drop function if exists public.get_preparation_stats(uuid, timestamptz, timestamptz, uuid, boolean, uuid);
drop function if exists public.get_preparation_stats(uuid, timestamptz, timestamptz, uuid, boolean, uuid, text, text);

create or replace function public.get_preparation_stats(
  p_bar_id uuid,
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_card_id uuid default null,
  p_uncarded_only boolean default false,
  p_cocktail_id uuid default null,
  p_profile text default null,
  p_base_spirits text[] default null
)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_total bigint;
  v_by_cocktail jsonb;
  v_by_card jsonb;
begin
  if not exists (
    select 1 from public.bars b
    where b.id = p_bar_id and b.owner_id = auth.uid()
  ) then
    raise exception 'Not authorized to view preparation statistics';
  end if;

  select coalesce(sum(pl.quantity), 0)::bigint
    into v_total
  from public.preparation_log pl
  where pl.bar_id = p_bar_id
    and (p_from is null or pl.prepared_at >= p_from)
    and (p_to is null or pl.prepared_at < p_to)
    and (
      p_card_id is null
      or exists (
        select 1 from public.menu_cards selected_card
        where selected_card.id = p_card_id
          and selected_card.bar_id = p_bar_id
          and pl.cocktail_id = any(selected_card.cocktail_ids)
      )
    )
    and (
      not p_uncarded_only
      or not exists (
        select 1 from public.menu_cards assigned_card
        where assigned_card.bar_id = p_bar_id
          and pl.cocktail_id = any(assigned_card.cocktail_ids)
      )
    )
    and (p_cocktail_id is null or pl.cocktail_id = p_cocktail_id)
    and (
      (p_profile is null and p_base_spirits is null)
      or exists (
        select 1 from public.bar_cocktails recipe
        where recipe.id = pl.cocktail_id
          and (p_profile is null or recipe.profile @> jsonb_build_array(p_profile))
          and (p_base_spirits is null or recipe.base_spirit = any(p_base_spirits))
      )
    );

  select coalesce(jsonb_agg(
    jsonb_build_object('cocktail_id', rows.cocktail_id, 'name', rows.name, 'count', rows.count)
    order by rows.count desc, rows.name
  ), '[]'::jsonb)
    into v_by_cocktail
  from (
    select pl.cocktail_id, c.name, sum(pl.quantity)::bigint as count
    from public.preparation_log pl
    left join public.bar_cocktails c on c.id = pl.cocktail_id
    where pl.bar_id = p_bar_id
      and (p_from is null or pl.prepared_at >= p_from)
      and (p_to is null or pl.prepared_at < p_to)
      and (
        p_card_id is null
        or exists (
          select 1 from public.menu_cards selected_card
          where selected_card.id = p_card_id
            and selected_card.bar_id = p_bar_id
            and pl.cocktail_id = any(selected_card.cocktail_ids)
        )
      )
      and (
        not p_uncarded_only
        or not exists (
          select 1 from public.menu_cards assigned_card
          where assigned_card.bar_id = p_bar_id
            and pl.cocktail_id = any(assigned_card.cocktail_ids)
        )
      )
      and (p_cocktail_id is null or pl.cocktail_id = p_cocktail_id)
      and (p_profile is null or c.profile @> jsonb_build_array(p_profile))
      and (p_base_spirits is null or c.base_spirit = any(p_base_spirits))
    group by pl.cocktail_id, c.name
  ) as rows;

  select coalesce(jsonb_agg(
    jsonb_build_object('card_id', rows.card_id, 'name', rows.name, 'count', rows.count)
    order by rows.count desc, rows.name nulls last
  ), '[]'::jsonb)
    into v_by_card
  from (
    select pl.card_id, mc.name, sum(pl.quantity)::bigint as count
    from public.preparation_log pl
    left join public.menu_cards mc on mc.id = pl.card_id
    where pl.bar_id = p_bar_id
      and (p_from is null or pl.prepared_at >= p_from)
      and (p_to is null or pl.prepared_at < p_to)
      and (p_cocktail_id is null or pl.cocktail_id = p_cocktail_id)
      and (
        (p_profile is null and p_base_spirits is null)
        or exists (
          select 1 from public.bar_cocktails recipe
          where recipe.id = pl.cocktail_id
            and (p_profile is null or recipe.profile @> jsonb_build_array(p_profile))
            and (p_base_spirits is null or recipe.base_spirit = any(p_base_spirits))
        )
      )
    group by pl.card_id, mc.name
  ) as rows;

  return jsonb_build_object(
    'total', v_total,
    'by_cocktail', v_by_cocktail,
    'by_card', v_by_card
  );
end;
$$;

revoke all on function public.get_preparation_stats(uuid, timestamptz, timestamptz, uuid, boolean, uuid, text, text[]) from public, anon;
grant execute on function public.get_preparation_stats(uuid, timestamptz, timestamptz, uuid, boolean, uuid, text, text[]) to authenticated;
