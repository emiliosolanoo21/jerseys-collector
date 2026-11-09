# Vestuario

Web app para llevar el control de una colección de camisolas de fútbol (y chumpas, suéteres u otras prendas): fotos de frente y espalda, tallas, detalles, favoritos y lista de deseos. Se instala en el teléfono como una app.

Hecha con Vue 3, TypeScript, Pinia, Vue Router, Vite y Supabase.

## Probarla en tu computadora

```bash
npm install
npm run dev
```

Sin configurar nada, la app funciona en **modo local**: los datos y las fotos se guardan solo en ese navegador.

## Conectar Supabase (para sincronizar entre teléfono y computadora)

1. Crea un proyecto en [supabase.com](https://supabase.com).
2. En **SQL Editor**, pega y ejecuta [supabase/schema.sql](supabase/schema.sql). Crea las tablas, el bucket privado de fotos y sus permisos.
3. Copia `.env.example` como `.env` y llena `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` (**Project Settings → API**).
4. Reinicia `npm run dev` y crea tu cuenta en la pantalla de inicio.
5. Cuando ya tengas tu cuenta, desactiva los registros nuevos en **Authentication → Providers → Email** para que nadie más pueda crear una.

## Publicarla en Netlify

El archivo `netlify.toml` ya trae la configuración. Solo conecta el repositorio y agrega `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY` en **Site configuration → Environment variables**.

## Instalarla en el teléfono

- **iPhone (Safari):** Compartir → Agregar a pantalla de inicio.
- **Android (Chrome):** menú → Instalar app.

## Dónde cambiar cosas

- Colores de los temas claro y oscuro: `src/style.css`.
- Logo: `src/components/BrandMark.vue` y `public/` (`favicon.svg` y los íconos PNG).
- Tipos de prenda, versiones, tallas y marcas: `src/data/options.ts`.
