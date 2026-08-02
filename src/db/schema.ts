import { pgTable, uuid, text, integer, decimal, boolean, timestamp, jsonb, customType, index } from "drizzle-orm/pg-core";

// Custom pgvector type for 1536-dimensional embeddings (OpenAI text-embedding-3-small)
export const vector = customType<{ data: number[] }>({
  dataType() {
    return "vector(1536)";
  },
  toDriver(value: number[]): string {
    return JSON.stringify(value);
  },
  fromDriver(value: unknown): number[] {
    if (typeof value === "string") {
      return JSON.parse(value);
    }
    return value as number[];
  },
});

// 0. Tabla AppConfig (Configuración dinámicas de Proveedor de Embeddings)
export const appConfig = pgTable("app_config", {
  id: uuid("id").primaryKey().defaultRandom(),
  embeddingProvider: text("embedding_provider", { enum: ["openai", "gemini"] }).default("openai").notNull(),
  embeddingModel: text("embedding_model").default("text-embedding-3-small").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// 1. Tabla Organizations
export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  whatsappInstanceId: text("whatsapp_instance_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 2. Tabla Users
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  // superadmin: acceso global | agency_admin: gestiona su org | agent: operativo
  role: text("role", { enum: ["superadmin", "agency_admin", "agent"] }).default("agent").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 3. Tabla Leads Piloto — capturas desde la Landing Page (sin autenticación requerida)
export const leadsPiloto = pgTable("leads_piloto", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  company: text("company"),             // Nombre de la agencia inmobiliaria
  city: text("city"),                   // Ciudad de operación
  phone: text("phone"),
  message: text("message"),
  utmSource: text("utm_source"),        // Para tracking de campañas
  status: text("status", { enum: ["NUEVO", "CONTACTADO", "DEMO_AGENDADA", "CONVERTIDO"] })
    .default("NUEVO")
    .notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// 3. Tabla Properties (con pgvector e índice HNSW)
export const properties = pgTable("properties", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  title: text("title").notNull(),
  city: text("city").notNull(),
  zone: text("zone").notNull(),
  priceUsd: decimal("price_usd", { precision: 12, scale: 2 }).notNull(),
  bedrooms: integer("bedrooms").notNull().default(1),
  bathrooms: integer("bathrooms").notNull().default(1),
  areaSqm: decimal("area_sqm", { precision: 8, scale: 2 }).notNull(),
  acceptsSocialHousing: boolean("accepts_social_housing").default(false).notNull(), // Acepta VIS/ASFI
  status: text("status", { enum: ["AVAILABLE", "RESERVED", "SOLD"] }).default("AVAILABLE").notNull(),
  rawDescription: text("raw_description").notNull(),
  featuresJson: jsonb("features_json").$type<Record<string, unknown>>().default({}),
  imageUrl: text("image_url"),
  embedding: vector("embedding"), // vector(1536)
}, (table) => [
  // Definición conceptual de índice HNSW sobre la columna embedding
  index("properties_embedding_hnsw_idx").on(table.embedding)
]);

// 4. Tabla Leads
export const leads = pgTable("leads", {
  id: uuid("id").primaryKey().defaultRandom(),
  organizationId: uuid("organization_id").references(() => organizations.id).notNull(),
  phoneNumber: text("phone_number").notNull(),
  fullName: text("full_name").notNull(),
  pipelineStage: text("pipeline_stage", {
    enum: [
      "NUEVO",
      "EN_CALIFICACION",
      "CALIFICADO_VISITA_PENDIENTE",
      "VISITA_REALIZADA",
      "EN_NEGOCIACION",
      "CERRADO",
    ],
  }).default("NUEVO").notNull(),
  budgetMaxUsd: decimal("budget_max_usd", { precision: 12, scale: 2 }),
  paymentMethod: text("payment_method", {
    enum: ["CREDITO_VIS", "CREDITO_BANCARIO", "CONTADO", "POR_DEFINIR"],
  }).default("POR_DEFINIR"),
  hasDownPayment: boolean("has_down_payment").default(false), // Aporte propio confirmado (10-20%)
  downPaymentPercent: integer("down_payment_percent").default(0),
  downPaymentBank: text("down_payment_bank"),
  preferredZone: text("preferred_zone"),
  propertyInterestId: uuid("property_interest_id").references(() => properties.id),
  assignedAgentId: uuid("assigned_agent_id").references(() => users.id),
  aiSummary: text("ai_summary"),
  aiPaused: boolean("ai_paused").default(false).notNull(),
  intentScore: integer("intent_score").default(50).notNull(), // 0 - 100
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
