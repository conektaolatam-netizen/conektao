-- Create table to persist POS table states per restaurant
create table if not exists public.table_states (
  id uuid primary key default gen_random_uuid(),
  restaurant_id uuid not null,
  table_number integer not null,
  status text not null default 'libre' check (status in ('libre','ocupada')),
  guest_count integer not null default 0,
  current_order jsonb not null default '[]'::jsonb,
  order_total numeric not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (restaurant_id, table_number)
);

-- Enable RLS
alter table public.table_states enable row level security;

-- Policies
create policy if not exists "Users can view table states in their restaurant"
  on public.table_states for select
  using (
    restaurant_id in (select profiles.restaurant_id from profiles where profiles.id = auth.uid())
  );

create policy if not exists "Users can insert table states for their restaurant"
  on public.table_states for insert
  with check (
    restaurant_id in (select profiles.restaurant_id from profiles where profiles.id = auth.uid())
  );

create policy if not exists "Users can update table states in their restaurant"
  on public.table_states for update
  using (
    restaurant_id in (select profiles.restaurant_id from profiles where profiles.id = auth.uid())
  );

create policy if not exists "Users can delete table states in their restaurant"
  on public.table_states for delete
  using (
    restaurant_id in (select profiles.restaurant_id from profiles where profiles.id = auth.uid())
  );

-- Trigger to maintain updated_at
create trigger if not exists update_table_states_updated_at
before update on public.table_states
for each row execute function public.update_updated_at_column();

-- Realtime support
alter table public.table_states replica identity full;
alter publication supabase_realtime add table if not exists public.table_states;