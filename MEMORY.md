# 🧠 MEMORY.md — Property OS (Historial de Despliegue e Infraestructura)

**Última actualización:** 07 de Agosto de 2026 (Fase 0 de Estabilización y Refactoring Modular Completada)
**Estado General:** La Fase 0 ha sido un éxito. Se ha eliminado la deuda técnica del monolito. El frontend y backend operan bajo una arquitectura modular limpia, escalable y preparada para inyectar los Add-Ons SaaS (Social Marketing, Legal Audit). Listos para implementar Fase 1.

---

## 🏗️ 1. HISTORIAL DE INFRAESTRUCTURA Y SERVICIOS

### 🟢 Base de Datos & Auth (Supabase)
* **Proyecto:** `lqagnlbygzurddkzbbwn` (`https://lqagnlbygzurddkzbbwn.supabase.co`).
* **SaaS Multi-Tenant Preparado:** Añadidas columnas `modules` (jsonb) para activar/desactivar add-ons por cliente, `primary_city` en `organizations` y `source_channel` en `leads` para tracking de marketing.
* **BANT Nativo:** Migración aplicada para integrar el `bant_score` directamente en la tabla `leads` y mapear presupuestos y zonas duras desde la IA a la BD.
* **Seguridad Front-end:** Implementado Bypass de Row Level Security (RLS) usando el JWT del `SERVICE_ROLE_KEY` en el dashboard.

### 🟢 Arquitectura de IA & Mensajería (Evolution API + OpenAI)
* **Refactoring Modular del Webhook:** El monolito de 600 líneas `webhook.ts` se ha convertido en un orquestador que consume servicios especializados en `/api/services/`:
  - `shared.ts`: Clientes DB y tipos.
  - `evolution-api.ts`: Envío robusto a WhatsApp.
  - `rag-search.ts`: Búsqueda vectorial pgvector aislada.
  - `sofia-prompt.ts`: Inyección de reglas de sistema (System Rules personalizables desde panel) y `<rag_enforcement>` estricto.
  - `bant-extractor.ts`: Scoring BANT estructurado forzando respuestas JSON del LLM.
  - `lead-manager.ts`: Orquestación de creación, guardado de mensajes y agendamiento.
* **Fixes IA P0 Integrados:** Año dinámico para agendamiento, `<rag_enforcement>` para obligar a Sofía a citar inventario real, y prevención de bucles de mensajes duplicados (deduplicación en 60s).

### 🟢 Frontend & UI (Vercel + Vite + React)
* **Refactoring de `App.tsx`:** Descompuesto el monolito gigante en componentes independientes de layout y features.
* **Fixes Críticos de Renderizado e Imágenes (Sprint Actual):**
  - Se implementó un parser robusto mediante **Expresiones Regulares (Regex)** en `imageHelper.ts` (`extractUrl`, `getSafeImageArray`) capaz de extraer URLs válidas desde strings corruptos, arrays de JSON, literales de Postgres (`"{http...}"`) y separaciones por comas.
  - Se solucionó una incompatibilidad de mapeo (`camelCase` vs `snake_case`) entre la base de datos (`image_url`) y `App.tsx` (`imageUrl`) que rompía las portadas en la Landing Page pública.
  - Se corrigió un bug potencial de caída (crash) eliminando variables indefinidas en los eventos `onError` de las imágenes.
  - Sincronización exitosa del bucket `'images'` para carga de inventario en `RagInventoryView.tsx`.
* **Despliegue a Producción:** Aplicación Vercel estabilizada tras resolver conflictos de caché local de Vercel y errores estrictos de TypeScript (tipado en webhook).

### 🟢 Módulo de Cotización Financiera & Tabla de Amortización (Sprint Ventaja Competitiva)
* **Utilidad Central (`src/utils/mortgageCalculator.ts`):** 
  - Soporte de Sistema Francés (cuota fija), Vivienda Social (VIS/ASFI ~5.5%), Crédito Hipotecario Bancario (~7.5%) y Financiamiento Directo Desarrollador (0% interés, cuotas fijas).
  - Cálculo de DTI (ingreso familiar requerido al 30%), desglose de capital, intereses, seguros y saldo insoluto período a período (hasta 360 meses) y resumen anual.
  - Generador de copy formateado para envío por WhatsApp en 1 clic.
* **Componente UI (`src/components/modals/MortgageCalculatorModal.tsx`):**
  - Modal interactivo con 3 pestañas: Simulador interactivo con sliders de precio/enganche/tasa/plazo, Tabla de amortización paginable (mensual/anual) y Análisis de Calificación BANT.
  - Modo impresión formal optimizado (`@media print`) para generar y descargar cotizaciones bancarias en PDF sin coste de APIs externas.
* **Integración en la Experiencia:**
  - Botón "📊 Cotizar & Amortización" en cada tarjeta de lead en `LeadCard.tsx` (Kanban).
  - Botón "📊 Simular Crédito & Tabla de Amortización" en la ficha de cada propiedad en `PropertyDetailModal.tsx`.

### 🟢 Módulo de Multi-Pipeline Inmobiliario (Sprint Ventaja Competitiva)
* **Arquitectura de Embudos (`src/types/property.ts` & `src/components/kanban/KanbanBoard.tsx`):**
  - **1. Embudo de Ventas (Compradores):** `NUEVO` ➔ `EN_CALIFICACION` ➔ `CALIFICADO_VISITA_PENDIENTE` ➔ `VISITA_AGENDADA` ➔ `VISITA_REALIZADA` ➔ `EN_NEGOCIACION` ➔ `CERRADO`.
  - **2. Embudo de Captación (Propietarios):** `PROSPECTO_PROPIETARIO` ➔ `EVALUACION_INMUEBLE` ➔ `ACM_ESTUDIO_MERCADO` ➔ `AUDITORIA_DOCUMENTAL` ➔ `CONTRATO_CONSIGNACION` ➔ `INMUEBLE_CAPTADO` (Publicado en RAG).
  - **3. Embudo de Alquileres (Rentas):** `SOLICITUD_RENTA` ➔ `PERFILAMIENTO_INGRESOS` ➔ `VISITA_RENTA` ➔ `REVISION_GARANTIAS` ➔ `CONTRATO_RENTA_FIRMADO`.
* **Experiencia de Usuario:**
  - Selector de pestañas dinámico en el encabezado del Kanban con conteos en vivo por embudo y cálculo de métricas financieras (volumen en cartera y cierres).
  - Selector de etapas inteligente en `LeadCard.tsx` que adapta sus opciones según la tipología de operación del prospecto.
  - Registro contextual en `NewLeadModal.tsx` con formularios adaptativos para Compradores, Propietarios e Inquilinos.

### 🟢 Módulo de Sincronización de Agenda & Google Calendar (Sprint Ventaja Competitiva)
* **Utilidad Universal de Calendario (`src/utils/calendarHelper.ts`):**
  - Generador de enlaces `TEMPLATE` a **Google Calendar** con formateo UTC ISO y parámetros estructurados (cliente, teléfono, presupuesto, notas y geoubicación).
  - Soporte de enlaces de **Outlook / Office 365 Web**.
  - Generador y descargador instantáneo de archivos estándar **`.ics` (iCalendar)** para Apple Calendar y Outlook Desktop.
  - Generador de mensajes con confirmación formal de visita + enlace directo de Google Calendar para enviar al WhatsApp del cliente en 1 clic.
* **Componentes UI Enriquecidos:**
  - `AppointmentModal.tsx`: Suite interactiva con selector de duración, ubicación, checkbox de sync automático a Google Calendar, botón de descarga .ICS y envío directo a WhatsApp.
  - `LeadCard.tsx`: Badge de cita interactivo en cada tarjeta con botón "Ver en Google Calendar" directo.

### 🟢 Módulo de Simulador Visual de Bot & Playground IA (Sprint Ventaja Competitiva)
* **Componente UI (`src/components/simulator/BotSimulatorView.tsx`):**
  - **Editor de Reglas & Prompt Studio:** Configuración en tiempo real del nombre del bot, avatar, especialización inmobiliaria (Ventas, Captación, Rentas), tono y personalidad, `<system_rules>`, `<fallbacks>`, y regla de blindaje RAG estricto anti-alucinación.
  - **Playground Interactivo (WhatsApp Sandbox):** Interfaz fidedigna de mensajería WhatsApp con burbujas de chat, indicador de escritura, double checks y pruebas con 1 solo clic (One-Click Prompts para Compradores VIS, Dueños para Captación, Citas y Rentas).
  - **Telemetría & Diagnóstico BANT en Vivo:** Desglose visual instantáneo de los parámetros extraídos (Budget, Authority, Need, Timeline, Score 0-100) e inmueble seleccionado por el motor RAG vectorial.
  - **Persistencia en Producción:** Guarda directamente en la columna `ai_config` de `organizations` en Supabase para actualización inmediata del webhook de WhatsApp.

---

## ⏳ 2. TAREAS PENDIENTES Y HOJA DE RUTA (PRÓXIMAS SESIONES)

### 🟡 Fase 5: Consolidación y Certificación de Lanzamiento
* **Certificación de Lanzamiento:** Generación del artefacto `LAUNCH_OVERVIEW.md` con la suite completa de ventajas competitivas frente al mercado Latam y competidores legacy como SigaBroker.

---

## 🔒 3. VARIABLES DE ENTORNO REQUERIDAS (`.env.local` / Vercel)

```env
# Supabase
VITE_SUPABASE_URL="https://lqagnlbygzurddkzbbwn.supabase.co"
VITE_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# Embeddings y LLM
GEMINI_API_KEY="..."
OPENAI_API_KEY="..."

# Evolution API
EVOLUTION_API_URL="https://evolution-api-production-286c8.up.railway.app"
EVOLUTION_API_KEY="..."
EVOLUTION_INSTANCE_NAME="PropertyOS-Main"

# Configuración de Agentes (Fase 1)
AGENT_PHONE_NUMBER="..."
```
