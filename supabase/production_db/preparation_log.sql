create table public.preparation_log (
  id uuid not null default gen_random_uuid (),
  bar_id uuid not null,
  cocktail_id uuid not null,
  card_id uuid null,
  quantity integer not null default 1,
  prepared_at timestamp with time zone not null default now(),
  constraint preparation_log_pkey primary key (id),
  constraint preparation_log_bar_id_fkey foreign KEY (bar_id) references bars (id) on delete CASCADE,
  constraint preparation_log_card_id_fkey foreign KEY (card_id) references menu_cards (id) on delete set null,
  constraint preparation_log_cocktail_id_fkey foreign KEY (cocktail_id) references bar_cocktails (id) on delete CASCADE,
  constraint preparation_log_quantity_check check (
    (
      (quantity >= 1)
      and (quantity <= 50)
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_preparation_log_bar_date on public.preparation_log using btree (bar_id, prepared_at desc) TABLESPACE pg_default;

create index IF not exists idx_preparation_log_bar_cocktail on public.preparation_log using btree (bar_id, cocktail_id) TABLESPACE pg_default;

create index IF not exists idx_preparation_log_bar_card on public.preparation_log using btree (bar_id, card_id) TABLESPACE pg_default;

create index IF not exists preparation_log_bar_prepared_at_idx on public.preparation_log using btree (bar_id, prepared_at desc) TABLESPACE pg_default;

create index IF not exists preparation_log_bar_cocktail_idx on public.preparation_log using btree (bar_id, cocktail_id) TABLESPACE pg_default;

create index IF not exists preparation_log_bar_card_idx on public.preparation_log using btree (bar_id, card_id) TABLESPACE pg_default;