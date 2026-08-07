# 📊 PROPERTY OS — STATUS REPORT 2

**Fecha:** 2026-08-06 (Cierre de Jornada)  
**Autor:** Lead Developer  
**Contexto:** Cierre de sprint P0 + Fase 1 BANT + Aprobación de Roadmap SaaS Modular

---

## 🏗️ 1. Arquitectura Actual Desplegada en Producción

| Componente | Tecnología | Estado |
|---|---|---|
| **Frontend** | Vite + React + TypeScript | ✅ Desplegado en `property-app-ashen.vercel.app` |
| **Backend (Serverless)** | Vercel Functions (Node.js) | ✅ Endpoints activos |
| **Base de Datos** | Supabase (PostgreSQL + pgvector) | ✅ Extensión HNSW activa |
| **Mensajería** | Evolution API v2 (Railway) | ✅ Instancia `PropertyOS-Main` conectada |
| **LLM Principal** | OpenAI `gpt-4o-mini` | ✅ Chat + BANT + Tool Calling |
| **Embeddings** | OpenAI `text-embedding-3-small` (768d) | ✅ Integrado en webhook + auto-embed |
| **Cron Jobs** | Vercel Cron (1x/día — plan Hobby) | ✅ `/api/cron/followup` configurado |

---

## 🗄️ 2. Estado de Base de Datos (Supabase)

### Tablas Core
| Tabla | Registros | Columnas Añadidas Hoy |
|---|---|---|
| `organizations` | 1 | `ai_config` (jsonb) — Protocolo Sofía |
| `leads` | ~10 | `bant_score` (jsonb) — Scoring BANT |
| `properties` | 68 | — |
| `users` | 0 | `phone_number` (text) — Alertas Push |
| `messages` | ~40 | — |
| `appointments` | ~3 | — |

### Migraciones SQL Aplicadas Hoy
| Archivo | Estado |
|---|---|
| `20260806_add_ai_config_to_org.sql` | ✅ Ejecutado en Supabase |
| `20260806_add_bant_to_leads.sql` | ✅ Ejecutado en Supabase |
| `20260806_add_phone_to_users.sql` | ✅ Ejecutado en Supabase |
| `20260806_create_rag_webhook.sql` | ✅ Webhook auto-embed configurado |

### Funciones RPC
| Función | Descripción | Estado |
|---|---|---|
| `match_properties` | Búsqueda vectorial coseno en PostgreSQL | ✅ Activa |

---

## 🧠 3. Inventario e IA (RAG)

| Métrica | Valor | Observación |
|---|---|---|
| Total propiedades | 68 | — |
| Con vector (embedding) | 20 | 🔴 **Solo 29% indexado** |
| Sin vector | 48 | Requiere re-indexación masiva |
| Endpoint de re-indexación | `/api/rag/reindex` | ✅ Creado, listo para ejecutar POST |
| Endpoint auto-embed | `/api/rag/auto-embed` | ✅ Dispara con INSERT/UPDATE en `properties` |
| Threshold de similitud | 0.3 | Puede subirse a 0.5 tras re-indexación |

---

## 🤖 4. Estado de Sofía IA (Webhook)

### Archivo: `api/whatsapp/webhook.ts` (497 líneas)

| Feature | Estado | Commit |
|---|---|---|
| Respuesta inmediata 200 OK + `waitUntil` | ✅ | P0 |
| Deduplicación por `messageId` (60s) | ✅ | P0 |
| Bloqueo `fromMe` (anti-loop propio) | ✅ | P0 |
| Freno lógico (msg corto sin historial) | ✅ | P0 |
| Historial de conversación (últimos 6 msgs) | ✅ | P0 |
| Prompt XML estructurado (`<system_rules>`, `<tone>`, `<fallbacks>`) | ✅ | P0 |
| `<rag_enforcement>` (forzar cita de inmuebles) | ✅ | `afcb003` |
| Tool Calling `agendar_visita` con año dinámico | ✅ | `afcb003` |
| Guard de loop: no ofrecer `agendar_visita` si ya está en `VISITA_AGENDADA` | ✅ | `afcb003` |
| Extracción BANT (segunda llamada `gpt-4o-mini` JSON mode) | ✅ | `afcb003` |
| BANT sincroniza `budget_max_usd` y `preferred_zone` en leads | ✅ | `ffda140` |
| Alertas Push WhatsApp al agente (3 niveles de fallback) | ✅ | `afcb003` |

### Bugs Conocidos en Producción (Pendientes de Validación)

| Bug | Fix Deployado | Validado en Vivo |
|---|---|---|
| Año 2023 en agendamiento | ✅ `new Date().getFullYear()` | ⏳ Pendiente |
| RAG respuestas genéricas | ✅ `<rag_enforcement>` | ⏳ Pendiente (depende de re-indexación) |
| Presupuesto $85k hardcoded | ✅ `bant_score?.budget` | ⏳ Pendiente |
| Zona "Equipetrol" hardcoded | ✅ `bant_score?.preferred_zone` | ⏳ Pendiente |

---

## ⚛️ 5. Frontend (10 archivos .tsx)

### Archivo Principal: `src/App.tsx` (934 líneas)

| Responsabilidad | Líneas Aprox. | Riesgo |
|---|---|---|
| Estado global (useState) | ~50 | 🟡 Disperso |
| Carga de datos Supabase | ~120 | 🟡 2 funciones duplicadas |
| Suscripción Realtime | ~30 | ✅ OK |
| Kanban Pipeline UI | ~400 | 🔴 Monolítico |
| Header + Navegación | ~80 | 🟡 Acoplado |
| Modales y drawers | ~150 | 🟡 Inline |

### Componentes
| Componente | Archivo | Líneas |
|---|---|---|
| SuperAdminPanel | `components/admin/SuperAdminPanel.tsx` | ~500 |
| LoginPage | `components/auth/LoginPage.tsx` | ~200 |
| ChatDrawer | `components/chat/ChatDrawer.tsx` | ~350 |
| RagInventoryView | `components/rag/RagInventoryView.tsx` | ~300 |
| PdfFichaModal | `components/modals/PdfFichaModal.tsx` | ~120 |
| AppointmentModal | `components/modals/AppointmentModal.tsx` | ~100 |
| NewLeadModal | `components/modals/NewLeadModal.tsx` | ~200 |

---

## 📡 6. Endpoints Serverless (Vercel Functions)

| Endpoint | Método | Función |
|---|---|---|
| `/api/whatsapp/webhook` | POST/GET | Cerebro principal de Sofía |
| `/api/rag/auto-embed` | POST | Auto-vectorización por webhook Supabase |
| `/api/rag/reindex` | POST | Re-indexación masiva (NUEVO) |
| `/api/cron/followup` | GET | Cron de seguimiento (1x/día) |
| `/api/whatsapp/test` | GET | Health check de env vars |

---

## 🔀 7. Git — Commits del Día

| Commit | Hash | Descripción |
|---|---|---|
| 1 | `afcb003` | fix: Sofia conversation protocol, RAG enforcement, and loop prevention |
| 2 | `18d01ec` | fix: Vercel hobby plan cron job limitation |
| 3 | `ffda140` | fix: BANT zone/budget sync, remove Equipetrol fallback, add RAG reindex endpoint |

---

## 🗺️ 8. Roadmap Aprobado

### FASE 0: Estabilización y Refactoring ← **SIGUIENTE**
- [ ] Re-indexar 100% del inventario RAG (48 propiedades pendientes)
- [ ] Descomponer `App.tsx` en componentes modulares
- [ ] Extraer servicios de `webhook.ts` (`sofia-prompt.ts`, `bant-extractor.ts`, `rag-search.ts`)
- [ ] Añadir `modules` (jsonb) a `organizations` para flags de módulos
- [ ] Validar los 4 bugs P0 corregidos en producción

### FASE 1: Marketing & Atribución de Canal
- [ ] Columna `source_channel` en `leads`
- [ ] Endpoint `/api/webhooks/meta-leads` (Facebook Lead Ads)
- [ ] Generador de Copy IA para publicaciones
- [ ] Flag `module_social_marketing`

### FASE 2: Auditoría Legal & Contratos
- [ ] Tabla `property_legal_audit` con semáforo DDRR
- [ ] UI de checklist legal por ciudad
- [ ] `global_legal_score` inyectado en prompt de Sofía
- [ ] `user_type` (INDEPENDENT_AGENT vs REAL_ESTATE_AGENCY)
- [ ] `primary_city` en organizations
- [ ] Generador de contratos/reservas (PDF)

---

## 🔐 9. Variables de Entorno Activas

```env
VITE_SUPABASE_URL       ✅ Configurada
VITE_SUPABASE_ANON_KEY  ✅ Configurada
SUPABASE_SERVICE_ROLE_KEY ✅ Configurada
OPENAI_API_KEY          ✅ Configurada
EVOLUTION_API_URL       ✅ Configurada
EVOLUTION_API_KEY       ✅ Configurada
EVOLUTION_INSTANCE_NAME ✅ PropertyOS-Main
GEMINI_API_KEY          ✅ Configurada
AGENT_PHONE_NUMBER      ⏳ No configurada (alertas push sin destino)
GOOGLE_SERVICE_ACCOUNT_KEY ⏳ No configurada (Calendar inactivo)
```

---

> **Próxima acción:** Iniciar FASE 0 de Estabilización y Refactoring con la descomposición de `App.tsx` y `webhook.ts` en módulos independientes, seguida de la re-indexación RAG al 100%.
