-- Perfil da usuária
create table if not exists perfis (
  id uuid references auth.users(id) on delete cascade primary key,
  nome text not null,
  o_que_faz text not null,
  icp text not null,
  rotina_frequencia integer not null default 3,
  rotina_canais text[] not null default '{}',
  created_at timestamptz default now()
);

alter table perfis enable row level security;

create policy "usuária vê só o próprio perfil"
  on perfis for all
  using (auth.uid() = id);

-- Contatos
create table if not exists contatos (
  id uuid default gen_random_uuid() primary key,
  usuario_id uuid references auth.users(id) on delete cascade not null,
  nome text not null,
  nicho text not null,
  canal_principal text not null,
  canal_secundario text,
  canal_terciario text,
  ponto_conexao text,
  instagram text,
  status text not null default 'na_lista',
  data_ultimo_contato timestamptz,
  data_abordagem timestamptz,
  data_fup1 timestamptz,
  data_fup2 timestamptz,
  data_fup3 timestamptz,
  adiamentos integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table contatos enable row level security;

create policy "usuária vê só os próprios contatos"
  on contatos for all
  using (auth.uid() = usuario_id);

-- Trigger para updated_at
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger contatos_updated_at
  before update on contatos
  for each row execute function update_updated_at();

-- Check-ins
create table if not exists checkins (
  id uuid default gen_random_uuid() primary key,
  usuario_id uuid references auth.users(id) on delete cascade not null,
  data date not null default current_date,
  feito boolean default false,
  acoes_feitas integer default 0,
  created_at timestamptz default now(),
  unique(usuario_id, data)
);

alter table checkins enable row level security;

create policy "usuária vê só os próprios checkins"
  on checkins for all
  using (auth.uid() = usuario_id);
