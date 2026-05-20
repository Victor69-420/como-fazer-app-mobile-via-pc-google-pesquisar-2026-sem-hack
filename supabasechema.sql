-- Execute este SQL no Supabase SQL Editor

-- Perfis de usuário (complementa o auth do Supabase)
create table if not exists profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  name        text not null,
  phone       text,
  tag         text default '🔧 Cliente ASR',
  orders_count int default 0,
  total_spent  numeric default 0,
  points       int default 0,
  created_at  timestamptz default now()
);

-- Carrinho
create table if not exists cart_items (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users(id) on delete cascade,
  product_id int not null,
  qty        int not null default 1,
  created_at timestamptz default now(),
  unique(user_id, product_id)
);

-- Pedidos
create table if not exists orders (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users(id) on delete cascade,
  order_id   text not null,
  items      jsonb not null,
  total      numeric not null,
  status     text default 'confirmado',
  payment    text,
  address    text,
  created_at timestamptz default now()
);

-- RLS (Row Level Security) — cada usuário só vê seus próprios dados
alter table profiles   enable row level security;
alter table cart_items enable row level security;
alter table orders     enable row level security;

create policy "profiles own" on profiles   for all using (auth.uid() = id);
create policy "cart own"     on cart_items for all using (auth.uid() = user_id);
create policy "orders own"   on orders     for all using (auth.uid() = user_id);

-- Trigger para criar perfil automaticamente ao registrar
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into profiles (id, name, phone)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();