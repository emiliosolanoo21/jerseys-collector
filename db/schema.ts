// Vestuario: esquema de la base de datos (Netlify Database / Postgres).
// Fuente de verdad: los cambios aquí se convierten en migraciones con
// `npx drizzle-kit generate --name <cambio>`.
//
// Diferencias con el esquema original de Supabase:
// - No existe `auth.users` ni `auth.uid()`: `user_id` es el id del usuario
//   autenticado y lo asigna el servidor (las funciones) en cada consulta.
// - No hay Row Level Security: el aislamiento por usuario se aplica en las
//   funciones filtrando siempre por `user_id`.
// - Las fotos no viven en la base de datos: `photo_front` / `photo_back`
//   guardan la clave del archivo en el almacenamiento (<user_id>/archivo.jpg).
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// Prendas: la colección y la lista de deseos viven en la misma tabla (status)
export const garments = pgTable(
  "garments",
  {
    id: uuid().primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    status: text().notNull().default("owned"),
    favorite: boolean().notNull().default(false),

    garmentType: text("garment_type").notNull().default("camisola"), // camisola | chumpa | sueter | pantaloneta | pants | calcetas | gorra | bufanda | otra
    typeOther: text("type_other"), // nombre de la prenda cuando garment_type = 'otra'
    team: text().notNull(), // club o selección
    kit: text(), // local | visitante | alternativa | portero | entrenamiento
    limitedEdition: boolean("limited_edition").notNull().default(false),
    editionNote: text("edition_note"), // p. ej. «Centenario, 123/500»
    season: text(), // p. ej. 2024/25
    brand: text(),

    size: text(),
    fit: text(), // hombre | mujer | nino | unisex
    version: text(), // aficionado | jugador | retro
    sleeve: text(), // corta | larga | sin
    condition: text(), // nueva_etiqueta | nueva | excelente | buena | usada
    color: text(),
    material: text(),

    playerName: text("player_name"),
    shirtNumber: text("shirt_number"), // texto: admite «00»
    patches: text(),
    signed: boolean().notNull().default(false),
    productCode: text("product_code"),
    notes: text(),

    acquiredOn: date("acquired_on"),
    price: numeric({ precision: 10, scale: 2 }), // lo que pagaste o, si es deseo, cuánto cuesta
    purchasePlace: text("purchase_place"),
    link: text(),

    photoFront: text("photo_front"), // clave del archivo en el almacenamiento de fotos
    photoBack: text("photo_back"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("garments_user_idx").on(t.userId, t.status),
    check("garments_status_check", sql`${t.status} in ('owned', 'wish')`),
  ],
);

// Ajustes (un documento JSON por usuario)
export const settings = pgTable("settings", {
  userId: uuid("user_id").primaryKey(),
  data: jsonb().notNull().default(sql`'{}'::jsonb`),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});
