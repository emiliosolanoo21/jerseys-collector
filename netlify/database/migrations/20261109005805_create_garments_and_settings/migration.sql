CREATE TABLE "garments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"user_id" uuid NOT NULL,
	"status" text DEFAULT 'owned' NOT NULL,
	"favorite" boolean DEFAULT false NOT NULL,
	"garment_type" text DEFAULT 'camisola' NOT NULL,
	"type_other" text,
	"team" text NOT NULL,
	"kit" text,
	"limited_edition" boolean DEFAULT false NOT NULL,
	"edition_note" text,
	"season" text,
	"brand" text,
	"size" text,
	"fit" text,
	"version" text,
	"sleeve" text,
	"condition" text,
	"color" text,
	"material" text,
	"player_name" text,
	"shirt_number" text,
	"patches" text,
	"signed" boolean DEFAULT false NOT NULL,
	"product_code" text,
	"notes" text,
	"acquired_on" date,
	"price" numeric(10,2),
	"purchase_place" text,
	"link" text,
	"photo_front" text,
	"photo_back" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "garments_status_check" CHECK ("status" in ('owned', 'wish'))
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"user_id" uuid PRIMARY KEY,
	"data" jsonb DEFAULT '{}' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "garments_user_idx" ON "garments" ("user_id","status");