-- FORJA · Postgres en Supabase
-- Solo dos tablas. Todo lo demas vive en el telefono.
-- Con 100 usuarios esto ocupa unos 3 MB del medio giga del tier gratuito.

-- ------------------------------------------------------------ perfiles
-- Fila minima por usuario. No guarda datos de entrenamiento.
create table public.perfiles (
  user_id     uuid primary key references auth.users(id) on delete cascade,
  nombre      text,
  objetivo    text,
  creado_en   timestamptz default now(),
  visto_en    timestamptz default now()
);

-- ----------------------------------------------------------- snapshots
-- Una fila por usuario. Se reemplaza entera en cada sincronizacion.
-- El campo datos es el JSON completo del historial, gzip y base64.
create table public.snapshots (
  user_id        uuid primary key references auth.users(id) on delete cascade,
  version        int not null default 1,
  datos          text not null,
  bytes          int,
  actualizado_en timestamptz default now()
);

-- Cinturon de seguridad: si un snapshot pasa de 2 MB, algo se rompio
-- en el cliente y conviene enterarse antes de que llene la base.
alter table public.snapshots
  add constraint snapshot_razonable check (bytes is null or bytes < 2097152);

-- --------------------------------------------------------------- RLS
-- Cada quien ve y escribe solo lo suyo. Sin excepciones ni rol de servicio
-- en el cliente.
alter table public.perfiles  enable row level security;
alter table public.snapshots enable row level security;

create policy "perfil propio: leer"     on public.perfiles
  for select using (auth.uid() = user_id);
create policy "perfil propio: escribir" on public.perfiles
  for insert with check (auth.uid() = user_id);
create policy "perfil propio: editar"   on public.perfiles
  for update using (auth.uid() = user_id);

create policy "snapshot propio: leer"     on public.snapshots
  for select using (auth.uid() = user_id);
create policy "snapshot propio: escribir" on public.snapshots
  for insert with check (auth.uid() = user_id);
create policy "snapshot propio: editar"   on public.snapshots
  for update using (auth.uid() = user_id);

-- Crea la fila de perfil automaticamente al registrarse.
create or replace function public.nuevo_usuario()
returns trigger language plpgsql security definer as $$
begin
  insert into public.perfiles (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.nuevo_usuario();

-- Monitoreo del costo: cuanto ocupa el historial de todos.
create view public.uso_almacenamiento as
select count(*) as usuarios,
       pg_size_pretty(sum(bytes)::bigint) as total,
       pg_size_pretty(avg(bytes)::bigint) as promedio_por_usuario
from public.snapshots;
