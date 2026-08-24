# 🧠 MEMORY.md — Property OS (Historial de Despliegue e Infraestructura)

**Última actualización:** 24 de Agosto de 2026 (Sprint B2B Growth & Real Data Validation — Cierre de Sesión)  
**Estado General:** Plataforma **operativa en producción**. Se completó la transición de datos sintéticos a **datos 100% reales mediante Google Places API**, enriquecimiento de sitios web con scraping de emails/WhatsApp, algoritmo de puntuación de calidad de datos (Data Quality Score), y el **módulo de prospección por WhatsApp Directo 1-Clic adaptado a la realidad del mercado boliviano**.

---

## 🌐 Entorno de Producción Oficial
* **URL de Producción (Vercel):** [https://property-app-ashen.vercel.app](https://property-app-ashen.vercel.app)
* **Commit activo:** `f066c1b` — feat(b2b): WhatsApp direct 1-click outreach, AI pitch copy generator, segment filter, and quick contact editor
* **Evolution API Gateway (Railway):** `https://evolution-api-production-a3a5.up.railway.app`
* **Instancia Activa:** `PropertyOS-Main`
* **Supabase Project:** `lqagnlbygzurddkzbbwn` (`https://lqagnlbygzurddkzbbwn.supabase.co`)

---

## 📊 STATUS DE LA PLATAFORMA (24-Ago-2026)

| Módulo | Estado | Notas |
|---|---|---|
| **B2B Prospección Agencias (Datos Reales)** | ✅ OPERATIVO | Google Places API + Scraper de emails + WhatsApp 1-Clic |
| **Generador de Pitch WhatsApp IA** | ✅ OPERATIVO | 3 enfoques para Bolivia (Sofía 24/7, Demo 15 min, Pitch Rápido) |
| **Filtros por Segmento & Ciudad** | ✅ OPERATIVO | Badges por ciudad + Segmentos (Celular/WA, Web, Email) |
| **Reportes B2B & Exportación CSV** | ✅ OPERATIVO | Resumen por ciudad, pipeline status y exportación CSV |
| **Edición Rápida de Contactos** | ✅ OPERATIVO | Pestaña de edición en modal con persistencia en Supabase |
| Sofía IA RAG WhatsApp | ✅ OPERATIVO | Webhook bidireccional activo en Evolution API |
| Kanban Multi-Pipeline | ✅ OPERATIVO | 3 embudos: Ventas, Captación, Alquileres |
| Cotizador Financiero | ✅ OPERATIVO | Sistema Francés, VIS/ASFI, Hipotecario |
| Contratos Digitales PDF | ✅ OPERATIVO | Reserva, Promesa, Consignación |
| Auditoría Legal | ✅ OPERATIVO | Semáforo de riesgo verde/amarillo/rojo |
| SuperAdmin SaaS | ✅ OPERATIVO | Multi-tenant, gobernanza y configuración IA |

---

## 🏗️ 1. HISTORIAL DE INNOVACIONES Y MÓDULOS COMPLETADOS

### 🟢 Módulo B2B Agency Prospecting — Datos Reales & WhatsApp Outreach (24-Ago-2026)
* **Integración Google Places API:**
  - Sustitución de generación sintética de IA por llamadas reales a Google Places (Text Search + Place Details).
  - Captura verificada de: `name`, `formatted_address`, `phone_official`, `website_url`, `rating`, `user_ratings_total`, `place_id`.
* **Validador de Sitios Web & Scraper de Emails:**
  - Acción `enrich`: Comprueba disponibilidad HTTP (`200`/`301`/`404`) de las páginas web.
  - Extracción automática por regex de correos de contacto corporativos (`info@...`, `contacto@...`) y números de WhatsApp (`wa.me/...`).
* **Algoritmo Data Quality Score (0-100%):**
  - `+25` Teléfono verificado
  - `+25` Sitio web activo
  - `+25` Email de contacto obtenido
  - `+25` Gerente o contacto clave registrado
* **Prospección por WhatsApp Directo 1-Clic (Canal #1 en Bolivia):**
  - Reconocimiento de numeración boliviana (`+591 6...`, `+591 7...`).
  - Modal con generador de pitch con IA en 3 enfoques (Sofía IA 24/7, Invitación a Demo, Presentación Rápida).
  - Botón de apertura directa `wa.me/591...` que actualiza automáticamente el estado en el pipeline a `CONTACTADO_WHATSAPP`.
* **Segmentación & Filtros Avanzados:**
  - Badges por ciudad con conteo en tiempo real.
  - Filtro por canal: `[ Todas ]` `[ 📱 Con Tel/WhatsApp ]` `[ 🌐 Con Web ]` `[ ✉️ Con Email ]`.
  - Búsqueda en tiempo real por texto (agencia, gerente, email, teléfono, zona).
* **Edición Rápida y Enriquecimiento Manual:**
  - Pestaña `✏️ Editar` en el modal de detalles con actualización inmediata en Supabase.
* **Reportes Ejecutivos & Exportación:**
  - Modal de reportes con métricas consolidadas por ciudad, pipeline status y exportación de CSV UTF-8 con BOM.
* **Handler Unificado (`api/admin/b2b.ts`):**
  - `search` (Google Places)
  - `enrich` (Scraping web)
  - `whatsapp_pitch` (Generador de copy WhatsApp con IA)
  - `invite` (Cold email HTML con IA)
  - `update` (Edición manual y estados)
  - `convert` (Conversión a tenant SaaS activo)
  - `list` (Consulta general)
  - `delete_ai` (Limpieza de registros ficticios)

### 🟢 Base de Datos & Migraciones Ejecutadas
1. `supabase/migrations/20260822_b2b_agency_prospects.sql`: Creación de tabla base `b2b_agency_prospects` y políticas RLS.
2. `supabase/migrations/20260824_b2b_real_data_enrichment.sql`: Columnas para `place_id`, `web_status`, `data_quality_score`, `data_source`, `google_rating`, `google_reviews`, `scrape_attempted_at`.

---

## ⏳ 2. HOJA DE RUTA PARA LA PRÓXIMA SESIÓN (Auditoría & Consolidación)

### 🔴 Tareas de Auditoría Operativa
1. **Revisión de resultados de prospección:**
   - Evaluación de tasas de respuesta por WhatsApp vs Cold Email en las principales plazas (Santa Cruz, La Paz, Cochabamba).
2. **Auditoría de Conversión a Tenants:**
   - Validar que los prospectos convertidos a través de `action: "convert"` inicien sesión con su configuración de módulos preactivada en `organizations`.
3. **Consolidación de Serverless Functions:**
   - Mantener el límite estricto de **12 Serverless Functions en Vercel Hobby** (actualmente 13; consolidar `api/booking` si se requiere nuevo endpoint).
4. **Envío Automático de Correos (Resend API):**
   - Enlazar Resend para agencias que sí cuenten con email validado y deseen cold email masivo automatizado.

---

## 🔒 3. VARIABLES DE ENTORNO CONFIGURADAS

```env
# Supabase
VITE_SUPABASE_URL="https://lqagnlbygzurddkzbbwn.supabase.co"
VITE_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# Embeddings y LLM
OPENAI_API_KEY="..."
GEMINI_API_KEY="..."

# Google Places API (Datos Reales B2B)
GOOGLE_PLACES_API_KEY="..."

# Evolution API (Railway)
EVOLUTION_API_URL="https://evolution-api-production-a3a5.up.railway.app"
EVOLUTION_API_KEY="a2bf8aaaec21a9806766c4a536c75e716d1480feff6f9705697bf626e8fab135"
EVOLUTION_INSTANCE_NAME="PropertyOS-Main"
```

---

## 📝 4. DECISIONES ARQUITECTÓNICAS REGISTRADAS

| Fecha | Decisión | Razón |
|---|---|---|
| 24-Ago-2026 | Migrar de generación sintética GPT a Google Places API | Los datos de contacto deben ser 100% reales, con teléfonos y direcciones auditables |
| 24-Ago-2026 | Priorizar WhatsApp Directo 1-Clic sobre Cold Email | El 85%+ de las inmobiliarias bolivianas operan por WhatsApp/teléfono, no por email corporativo |
| 24-Ago-2026 | Algoritmo Data Quality Score (0-100%) | Permite filtrar y priorizar agencias con datos completos antes de contactar |
| 24-Ago-2026 | Web Scraping asíncrono con timeout de 6s | Evita bloquear la UI al verificar dominios lentos o caídos |
| 22-Ago-2026 | Consolidar endpoints B2B en único handler `api/admin/b2b.ts` | Límite de 12 funciones serverless en Vercel Hobby |
| 22-Ago-2026 | Pausa del módulo Flow/Marketing Studio | Priorizar adquisición B2B de agencias antes de expandir herramientas de video |
