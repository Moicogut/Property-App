# 🧠 MEMORY.md — Property OS (Historial de Despliegue e Infraestructura)

**Última actualización:** 24 de Agosto de 2026 (Cierre Oficial de Auditoría Técnico-Funcional & Certificación de Salida)  
**Estado General:** Plataforma **100% remediada y certificada para entrada a Piloto Comercial**. Se levantó el 100% de los defectos P0/P1 de la Auditoría Técnico-Funcional: erradicación de defaults fantasma, aislamiento multi-tenant con RLS y segregación demo/producción, sincronización horaria dinámica oficial de Bolivia (`America/La_Paz`, GMT-4), patrón Tool-First y escalamiento humano en Sofía IA, Quality Gates en el CRM, disclaimer regulatorio ASFI y generación de informes oficiales en Word y PDF con identidad Obsidian/Champagne Gold.

---

## 🌐 Entorno de Producción Oficial
* **URL de Producción (Vercel):** [https://property-app-ashen.vercel.app](https://property-app-ashen.vercel.app)
* **Commit activo:** `52211b7` — feat: remediacion auditoria integral P0/P1 - aislamiento tenant, reloj Bolivia, quality gates y Sofia confiable
* **Evolution API Gateway (Railway):** `https://evolution-api-production-a3a5.up.railway.app`
* **Instancia Activa:** `PropertyOS-Main`
* **Supabase Project:** `lqagnlbygzurddkzbbwn` (`https://lqagnlbygzurddkzbbwn.supabase.co`)
* **Documentos Oficiales Generados:**
  - Word: `INFORME_DE_RESPUESTA_AUDITORIA_PROPERTY_OS.docx`
  - PDF: `INFORME_DE_RESPUESTA_AUDITORIA_PROPERTY_OS.pdf`

---

## 📊 STATUS DE LA PLATAFORMA (24-Ago-2026 — Auditoría Certificada)

| Módulo | Estado | Notas |
|---|---|---|
| **Sofía IA RAG WhatsApp (Oficial Piloto)** | ✅ CERTIFICADO | Tool-First, reloj La Paz, trazabilidad BANT y escalamiento humano |
| **Kanban Ventas & Compradores (Piloto GA)**| ✅ CERTIFICADO | Quality Gates activos, prevención de duplicados E.164 |
| **Aislamiento Multi-Tenant & RLS** | ✅ CERTIFICADO | Migración SQL `20260824_v10`, flags `is_demo`, RPC seguro |
| **Cotizador Financiero & ASFI** | ✅ CERTIFICADO | Sistema Francés, VIS/ASFI con leyenda legal regulatoria |
| **Catálogo Público & Portal Web** | ✅ CERTIFICADO | Taxonomía canónica (Depto, Casa, Terreno, Oficina, Local) |
| **SuperAdmin SaaS & Gobernanza** | ✅ CERTIFICADO | Separación explícita entre 'Volver al CRM' y 'Cerrar Sesión' |
| **B2B Prospección Agencias (Datos Reales)** | ✅ OPERATIVO | Google Places API + Scraper de emails + WhatsApp 1-Clic |
| **Contratos Digitales PDF** | ✅ OPERATIVO | Reserva, Promesa, Consignación |
| **Auditoría Legal Inmuebles** | ✅ OPERATIVO | Semáforo verde/amarillo/rojo (exclusión automática en RAG) |
| **Pipelines Captaciones y Alquileres** | 🟡 BETA INTERNA | Etiquetados explícitamente para no contaminar el piloto |

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
| 24-Ago-2026 | Certificación Sprint 4 (Gate Review & Piloto Listo) | 100% de defectos P0/P1 auditados remediados. Compilación de producción en verde (0 errores de tipos TS). Cobertura completa de aislamiento multi-tenant, Sofía supervisada bajo hora oficial Bolivia y pipelines con Quality Gates listos para el primer piloto comercial. |
| 24-Ago-2026 | Remediación Sprint 3 (Cotizador ASFI & UX Gobernanza) | Inserción de descargo regulatorio ASFI y eliminación de defaults en MortgageCalculatorModal (COT-01, COT-02). Diferenciación estricta entre retorno al CRM y cierre de sesión en SuperAdminPanel (AUTH-01). |
| 24-Ago-2026 | Remediación Sprint 2 (Núcleo CRM & Catálogo Canónico) | Implementación de Quality Gates en LeadCard/KanbanBoard (CRM-02), normalización de teléfonos a formato E.164 (CRM-04), clasificación canónica de inmuebles en LandingPage (PORT-02) y etiquetado explícito de Captación/Rentas como Beta Interna (CRM-03). |
| 24-Ago-2026 | Remediación Sprint 1 (Sofía IA Confiable & Supervisada) | Implementación de patrón Tool-First y validación estricta de agendamiento futuro en api/booking/index.ts (IA-03, IA-04). Inyección de reloj dinámico America/La_Paz en sofia-prompt.ts y normalización de etapas canónicas en SofiaPublicChatModal (CRM-02). |
| 24-Ago-2026 | Remediación Sprint 0 (Contención y Verdad del Dato) | Auditoría Técnico-Funcional: Eliminación de defaults en NewLeadModal y RagInventoryView (CRM-01, INV-01), migración 20260824_v10 con is_demo/tenant isolation (SAAS-02, INV-02), reloj America/La_Paz dinámico (IA-03), procedencia BANT (IA-02), y estandarización a 768d (IA-06). |
| 24-Ago-2026 | Migrar de generación sintética GPT a Google Places API | Los datos de contacto deben ser 100% reales, con teléfonos y direcciones auditables |
| 24-Ago-2026 | Priorizar WhatsApp Directo 1-Clic sobre Cold Email | El 85%+ de las inmobiliarias bolivianas operan por WhatsApp/teléfono, no por email corporativo |
| 24-Ago-2026 | Algoritmo Data Quality Score (0-100%) | Permite filtrar y priorizar agencias con datos completos antes de contactar |
| 24-Ago-2026 | Web Scraping asíncrono con timeout de 6s | Evita bloquear la UI al verificar dominios lentos o caídos |
| 22-Ago-2026 | Consolidar endpoints B2B en único handler `api/admin/b2b.ts` | Límite de 12 funciones serverless en Vercel Hobby |
| 22-Ago-2026 | Pausa del módulo Flow/Marketing Studio | Priorizar adquisición B2B de agencias antes de expandir herramientas de video |

