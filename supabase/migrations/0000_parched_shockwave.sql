CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE "leads" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"phone_number" text NOT NULL,
	"full_name" text NOT NULL,
	"pipeline_stage" text DEFAULT 'NUEVO' NOT NULL,
	"budget_max_usd" numeric(12, 2),
	"payment_method" text DEFAULT 'POR_DEFINIR',
	"has_down_payment" boolean DEFAULT false,
	"down_payment_percent" integer DEFAULT 0,
	"down_payment_bank" text,
	"preferred_zone" text,
	"property_interest_id" uuid,
	"assigned_agent_id" uuid,
	"ai_summary" text,
	"ai_paused" boolean DEFAULT false NOT NULL,
	"intent_score" integer DEFAULT 50 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "leads_piloto" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"full_name" text NOT NULL,
	"email" text NOT NULL,
	"company" text,
	"city" text,
	"phone" text,
	"message" text,
	"utm_source" text,
	"status" text DEFAULT 'NUEVO' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"whatsapp_instance_id" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"title" text NOT NULL,
	"city" text NOT NULL,
	"zone" text NOT NULL,
	"price_usd" numeric(12, 2) NOT NULL,
	"bedrooms" integer DEFAULT 1 NOT NULL,
	"bathrooms" integer DEFAULT 1 NOT NULL,
	"area_sqm" numeric(8, 2) NOT NULL,
	"accepts_social_housing" boolean DEFAULT false NOT NULL,
	"status" text DEFAULT 'AVAILABLE' NOT NULL,
	"raw_description" text NOT NULL,
	"features_json" jsonb DEFAULT '{}'::jsonb,
	"image_url" text,
	"embedding" vector(1536)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid,
	"email" text NOT NULL,
	"full_name" text NOT NULL,
	"role" text DEFAULT 'agent' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_property_interest_id_properties_id_fk" FOREIGN KEY ("property_interest_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "leads" ADD CONSTRAINT "leads_assigned_agent_id_users_id_fk" FOREIGN KEY ("assigned_agent_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "properties_embedding_hnsw_idx" ON "properties" USING hnsw ("embedding" vector_cosine_ops);