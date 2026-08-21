# 🧠 MEMORY.md — Property OS (Historial de Despliegue e Infraestructura)

**Última actualización:** 21 de Agosto de 2026 (Sprint de Estabilización WhatsApp & Suite Competitiva v2.5)  
**Estado General:** La plataforma se encuentra **100% desplegada y operativa en producción**. WhatsApp Evolution API y Sofía IA están comunicándose bidireccionalmente con Property OS, con persistencia y visualización en tiempo real en el Kanban y Central Chat.

---

## 🌐 Entorno de Producción Oficial
* **URL de Producción (Vercel):** [https://property-app-ashen.vercel.app](https://property-app-ashen.vercel.app)
* **Evolution API Gateway (Railway):** `https://evolution-api-production-a3a5.up.railway.app`
* **Instancia Activa:** `PropertyOS-Main`
* **Supabase Project:** `lqagnlbygzurddkzbbwn` (`https://lqagnlbygzurddkzbbwn.supabase.co`)

---

## 🏗️ 1. HISTORIAL DE INNOVACIONES Y MÓDULOS COMPLETADOS

### 🟢 Módulo de Cotización Financiera & Tabla de Amortización
* **Motor Matemático (`src/utils/mortgageCalculator.ts`):** 
  - Cálculo de cuotas fijas bajo **Sistema Francés**, Vivienda Social VIS/ASFI (~5.5%), Hipotecario Bancario (~7.5%) y Financiamiento Directo 0%.
  - Tabla de amortización período a período (hasta 360 meses) con desglose de capital, intereses, seguros y saldo insoluto.
  - Cálculo de DTI (ingreso familiar requerido al 30%) y generador de copys WhatsApp.
* **Componente UI (`src/components/modals/MortgageCalculatorModal.tsx`):**
  - Modal interactivo con sliders dinámicos, tabla paginable y exportación PDF vía `@media print`.
  - Integrado en `LeadCard.tsx` (Kanban) y `PropertyDetailModal.tsx`.

### 🟢 Módulo de Arquitectura Multi-Pipeline (3 Embudos Especializados)
* **Tipología y Columnas Dinámicas (`src/types/property.ts` & `src/components/kanban/KanbanBoard.tsx`):**
  - **1. Embudo de Ventas (Compradores):** `NUEVO` ➔ `EN_CALIFICACION` ➔ `CALIFICADO_VISITA_PENDIENTE` ➔ `VISITA_AGENDADA` ➔ `VISITA_REALIZADA` ➔ `EN_NEGOCIACION` ➔ `CERRADO`.
  - **2. Embudo de Captación (Propietarios):** `PROSPECTO_PROPIETARIO` ➔ `EVALUACION_INMUEBLE` ➔ `ACM_ESTUDIO_MERCADO` ➔ `AUDITORIA_DOCUMENTAL` ➔ `CONTRATO_CONSIGNACION` ➔ `INMUEBLE_CAPTADO`.
  - **3. Embudo de Alquileres (Rentas):** `SOLICITUD_RENTA` ➔ `PERFILAMIENTO_INGRESOS` ➔ `VISITA_RENTA` ➔ `REVISION_GARANTIAS` ➔ `CONTRATO_RENTA_FIRMADO`.
* **Experiencia de Usuario:**
  - Selector de pestañas dinámico en Kanban con contadores y volumen en cartera en vivo.
  - Selector contextual de etapas en `LeadCard.tsx` y creación adaptativa en `NewLeadModal.tsx`.

### 🟢 Módulo de Sincronización Universal de Calendarios
* **Utilidad (`src/utils/calendarHelper.ts`):**
  - Generador de enlaces `TEMPLATE` a **Google Calendar** con formateo UTC ISO, parámetros BANT y geolocalización.
  - Generador y descargador instantáneo de archivos estándar **`.ics` (iCalendar)** para Apple Calendar y Outlook.
  - Redacción automática de mensaje de confirmación para WhatsApp con enlace a Google Calendar y GPS.
* **Componentes UI Enriquecidos:**
  - `AppointmentModal.tsx`: Selector de duración, sync automático a Google Calendar, descarga `.ics` y envío WhatsApp.
  - `LeadCard.tsx`: Badge interactivo con botón directo "Ver en Google Calendar".

### 🟢 Módulo de Simulador Visual de Bot & Playground IA
* **Componente UI (`src/components/simulator/BotSimulatorView.tsx`):**
  - **Editor de Reglas & Prompt Studio:** Configuración en tiempo real del nombre del bot, especialización, tono, `<system_rules>`, `<fallbacks>` y regla RAG estricta anti-alucinación.
  - **Playground Interactivo (WhatsApp Sandbox):** Interfaz fidedigna de WhatsApp con pruebas One-Click (Compradores VIS, Dueños para Captación, Citas y Rentas).
  - **Telemetría BANT en Vivo:** Desglose visual en tiempo real de Budget, Authority, Need, Timeline y RAG Match.
  - **Persistencia en DB:** Guardado directo en la columna `ai_config` de Supabase para adopción inmediata del webhook.

### 🟢 Estabilización de Webhook Serverless & Sincronización Realtime
* **Webhook Serverless Autónomo (`api/whatsapp/webhook.ts`):**
  - Eliminadas dependencias problemáticas de cold start (`waitUntil`), implementando un handler asíncrono robusto con Proxy Lazy de Supabase.
  - Guardado exacto de mensajes en la tabla `messages` con roles `'lead'` y `'ai_sofia'` y columna `text`.
  - Actualización automática de `budget_max_usd`, `preferred_zone`, `pipeline_stage`, `ai_summary` y `bant_score` en la tabla `leads`.
* **Sincronización Continua Frontend (`src/App.tsx` & `src/components/chat/ChatDrawer.tsx`):**
  - Polling de alta fidelidad cada 4 segundos + suscripción Postgres Realtime para refresco automático del Kanban y ChatDrawer sin necesidad de recargar la página.

---

## ⏳ 2. TAREAS PENDIENTES Y HOJA DE RUTA (PRÓXIMA SESIÓN)

### 🟡 1. Calibración Fina de Sofía IA (Forma y Fondo)
* **Filtrado Geográfico Estricto en RAG:** Si el usuario pide una zona específica (ej. *Calacoto en La Paz*), el motor RAG debe filtrar prioritariamente por `city` y `zone` antes de buscar por similitud semántica para evitar recomendar inmuebles de otras zonas (ej. *Sopocachi*) sin advertir la diferencia.
* **Manejo de Respuestas Mixtas:** Pulir la redacción cuando el usuario solicita alquiler y venta en la misma frase para dar 1 opción de cada categoría de forma limpia.
* **Calibración de Tono Comercial:** Refinar las instrucciones de persuasión para que Sofía ofrezca proactivamente agendar visitas presenciales cuando el cliente muestre alta intención.

### 🟡 2. Ficha Lateral de Calificación IA en ChatDrawer
* **Sincronización de Widgets BANT:** Conectar los indicadores de la barra lateral derecha de `ChatDrawer.tsx` (*Presupuesto, Tipo de Pago, Aporte Propio, Zona Preferida y Score*) para que se actualicen en vivo según el último `bant_score` registrado.

### 🟡 3. Legal & Cierres Formales
* **Checklist Legal de Lead:** Hitos de validación documental (Derechos Reales, Impuestos al día, Folio Real).
* **Generador de Contratos Digitales:** Exportación de PDF formal de reserva y consignación con datos del comprador y vendedor.

---

## 🔒 3. VARIABLES DE ENTORNO EN PRODUCCIÓN

```env
# Supabase
VITE_SUPABASE_URL="https://lqagnlbygzurddkzbbwn.supabase.co"
VITE_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_ROLE_KEY="..."

# Embeddings y LLM
OPENAI_API_KEY="..."
GEMINI_API_KEY="..."

# Evolution API (Railway)
EVOLUTION_API_URL="https://evolution-api-production-a3a5.up.railway.app"
EVOLUTION_API_KEY="a2bf8aaaec21a9806766c4a536c75e716d1480feff6f9705697bf626e8fab135"
EVOLUTION_INSTANCE_NAME="PropertyOS-Main"
```
