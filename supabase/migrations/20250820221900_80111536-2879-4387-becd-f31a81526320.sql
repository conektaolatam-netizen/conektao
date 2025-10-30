-- Create receipts storage bucket and policies
insert into storage.buckets (id, name, public)
values ('receipts', 'receipts', true)
on conflict (id) do nothing;

-- Policies for receipts bucket
-- Public read access
create policy if not exists "Receipts are publicly accessible"
  on storage.objects
  for select
  using (bucket_id = 'receipts');

-- Users can upload their own receipts into a folder named by their user id
create policy if not exists "Users can upload their own receipts"
  on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'receipts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can update their own receipts
create policy if not exists "Users can update their own receipts"
  on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'receipts'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'receipts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own receipts
create policy if not exists "Users can delete their own receipts"
  on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'receipts'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- Expenses table
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  supplier_name text,
  invoice_number text,
  expense_date timestamptz not null default now(),
  currency text default 'MXN',
  subtotal numeric not null default 0,
  tax numeric default 0,
  total_amount numeric not null default 0,
  status text default 'processed',
  created_at timestamptz not null default now()
);

-- Expense items table
create table if not exists public.expense_items (
  id uuid primary key default gen_random_uuid(),
  expense_id uuid not null references public.expenses(id) on delete cascade,
  product_id uuid references public.products(id),
  description text not null,
  quantity numeric not null,
  unit text,
  unit_price numeric not null,
  subtotal numeric not null,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.expenses enable row level security;
alter table public.expense_items enable row level security;

-- Policies for expenses (similar to sales)
create policy if not exists "Users can access expenses in their restaurant"
  on public.expenses
  for all
  using (
    exists (
      select 1 from profiles p1
      where p1.id = auth.uid()
        and p1.restaurant_id = (
          select p2.restaurant_id from profiles p2 where p2.id = expenses.user_id
        )
    )
  );

create policy if not exists "Users can only see their own expenses"
  on public.expenses
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Policies for expense_items (similar to sale_items)
create policy if not exists "Users can access expense items in their restaurant"
  on public.expense_items
  for all
  using (
    exists (
      select 1
      from expenses e
      join profiles p on e.user_id = p.id
      where e.id = expense_items.expense_id
        and p.restaurant_id = (
          select profiles.restaurant_id from profiles where profiles.id = auth.uid()
        )
    )
  );

create policy if not exists "Users can only see their own expense items"
  on public.expense_items
  for all
  using (
    exists (
      select 1 from expenses e
      where e.id = expense_items.expense_id and e.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from expenses e
      where e.id = expense_items.expense_id and e.user_id = auth.uid()
    )
  );

-- Helpful indexes
create index if not exists idx_expenses_user_date on public.expenses(user_id, expense_date desc);
create index if not exists idx_expense_items_expense on public.expense_items(expense_id);
