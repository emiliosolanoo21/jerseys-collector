-- Vestuario: esquema de base de datos para Supabase (Postgres).
-- Ejecútalo una vez en Supabase -> SQL Editor -> New query -> Run.
-- Cada fila y cada foto pertenecen a un usuario, y Row Level Security
-- garantiza que solo tú puedas leerlas y escribirlas.

-- Prendas: la colección y la lista de deseos viven en la misma tabla (status)
create table if not exists garments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  status text not null default 'owned' check (status in ('owned', 'wish')),
  favorite boolean not null default false,

  garment_type text not null default 'camisola', -- camisola | chumpa | sueter | pantaloneta | pants | calcetas | gorra | bufanda | otra
  type_other text,                               -- nombre de la prenda cuando garment_type = 'otra'
  team text not null,                            -- club o selección
  kit text,                                      -- local | visitante | alternativa | portero | entrenamiento
  limited_edition boolean not null default false,
  edition_note text,                             -- p. ej. «Centenario, 123/500»
  season text,                                   -- p. ej. 2024/25
  brand text,

  size text,
  fit text,                                      -- hombre | mujer | nino | unisex
  version text,                                  -- aficionado | jugador | retro
  sleeve text,                                   -- corta | larga | sin
  condition text,                                -- nueva_etiqueta | nueva | excelente | buena | usada
  color text,
  material text,

  player_name text,
  shirt_number text,                             -- texto: admite «00»
  patches text,
  signed boolean not null default false,
  product_code text,
  notes text,

  acquired_on date,
  price numeric(10,2),                           -- lo que pagaste o, si es deseo, cuánto cuesta
  purchase_place text,
  link text,

  photo_front text,                              -- ruta en el bucket garment-photos
  photo_back text,
  created_at timestamptz not null default now()
);

create index if not exists garments_user_idx on garments (user_id, status);

-- Ajustes (un documento JSON por usuario)
create table if not exists settings (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- Row Level Security: cada quien solo ve lo suyo
do $$
declare t text;
begin
  foreach t in array array['garments','settings'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "own rows" on %I', t);
    execute format(
      'create policy "own rows" on %I for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', t);
  end loop;
end $$;

-- Fotos: bucket privado; cada usuario solo usa su propia carpeta (<user_id>/archivo.jpg)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('garment-photos', 'garment-photos', false, 5242880, array['image/jpeg'])
on conflict (id) do nothing;

drop policy if exists "own garment photos" on storage.objects;
create policy "own garment photos" on storage.objects
  for all to authenticated
  using (bucket_id = 'garment-photos' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'garment-photos' and (storage.foldername(name))[1] = auth.uid()::text);
