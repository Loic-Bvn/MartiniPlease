create table public.menu_cards (
  id uuid not null default gen_random_uuid (),
  name text not null,
  cocktail_ids uuid[] null default '{}'::uuid[],
  created_at timestamp with time zone null default now(),
  bar_id uuid null,
  is_visible boolean null default true,
  constraint menu_cards_pkey primary key (id),
  constraint menu_cards_bar_id_fkey foreign KEY (bar_id) references bars (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_menu_cards_bar_id on public.menu_cards using btree (bar_id) TABLESPACE pg_default;

create trigger menu_cards_stats
after INSERT
or DELETE on menu_cards for EACH row
execute FUNCTION trigger_recalc_bar_statistics ();