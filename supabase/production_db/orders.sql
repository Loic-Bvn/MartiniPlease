create table public.orders (
  id uuid not null default gen_random_uuid (),
  bar_id uuid not null,
  drinker_id uuid not null,
  cocktail_id uuid not null,
  status text not null default 'pending'::text,
  created_at timestamp with time zone null default now(),
  completed_at timestamp with time zone null,
  constraint orders_pkey primary key (id),
  constraint orders_bar_id_fkey foreign KEY (bar_id) references bars (id) on delete CASCADE,
  constraint orders_cocktail_id_fkey foreign KEY (cocktail_id) references bar_cocktails_bis (id) on delete CASCADE,
  constraint orders_drinker_id_fkey foreign KEY (drinker_id) references drinker_profiles (id) on delete CASCADE,
  constraint orders_status_check check (
    (
      status = any (array['pending'::text, 'completed'::text])
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_orders_bar_id on public.orders using btree (bar_id) TABLESPACE pg_default;

create index IF not exists idx_orders_bar_status on public.orders using btree (bar_id, status) TABLESPACE pg_default;

create index IF not exists idx_orders_drinker_id on public.orders using btree (drinker_id) TABLESPACE pg_default;

create index IF not exists idx_orders_status on public.orders using btree (status) TABLESPACE pg_default;

create index IF not exists idx_orders_created_at on public.orders using btree (created_at) TABLESPACE pg_default;