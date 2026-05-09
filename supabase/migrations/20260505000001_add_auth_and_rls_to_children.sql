-- Add Supabase Auth scoping to children: each row belongs to one user.
-- Enables RLS so users can only access their own data.

alter table public.children
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- Default to current authenticated user — keeps the "row belongs to caller"
-- invariant in the database, so application code can't violate it.
alter table public.children
  alter column user_id set default auth.uid();

alter table public.children enable row level security;

create policy "users select own children"
  on public.children for select
  using (auth.uid() = user_id);

create policy "users insert own children"
  on public.children for insert
  with check (auth.uid() = user_id);

create policy "users update own children"
  on public.children for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "users delete own children"
  on public.children for delete
  using (auth.uid() = user_id);

create index if not exists children_user_id_idx
  on public.children(user_id);
