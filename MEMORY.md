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
### 🟢 Módulo de Ficha Lateral de Calificación IA en ChatDrawer (Telemetría BANT Realtime)
* **Sincronización Bidireccional (`src/components/chat/ChatDrawer.tsx`):**
  - Estado local reactivo `liveLead` sincronizado con Supabase (`messages` y `leads` con join a `matchedProperty:properties(*)`) vía polling (3.5s) y canal Postgres Realtime.
  - Telemetría BANT en vivo: Termómetro de temperatura de intención (0-100), desglose de 4 pilares (Presupuesto B, Autoridad/Aporte A, Zona/Necesidad N, Plazo/Urgencia T) y badge de etapa de pipeline dinámico.
  - Diagnóstico ejecutivo de Sofía IA (`aiSummary`), tarjeta de match RAG con foto y afinidad en %, y botones de acción rápida para Google Calendar, Ficha de Reserva PDF y control humano/IA persistente.

### 🟢 Módulo de Calibración Fina de Sofía IA & RAG Geográfico (`api/whatsapp/webhook.ts`)
* **Extracción de Entidades & Filtrado Geográfico:**
  - Extractor semántico de ciudad (`Santa Cruz`, `La Paz`, `Cochabamba`, etc.) y zona (`Calacoto`, `Sopocachi`, `Equipetrol`, `Sirari`, `Urubó`, etc.).
  - Motor RAG con pre-filtrado prioritario por zona y ciudad antes del scoring coseno para evitar alucinaciones geográficas entre ciudades. Fallback contextual con `geoNotice` que instruye a Sofía a ser transparente si no hay stock en la zona exacta pero sí en la misma ciudad.
* **Manejo de Consultas Mixtas (Venta + Alquiler):**
  - Detección de intenciones mixtas en el mismo turno; Sofía estructura la respuesta presentando 1 opción en venta (con precio y cuota referencial VIS) y 1 opción en alquiler (con canon mensual).
* **Proactividad Comercial de Cierre hacia Visitas Presenciales:**
  - Cuando el prospecto califica con `intent_score >= 80` o muestra interés concreto, Sofía propone proactivamente coordinar visita presencial o videollamada guiada.
* **Clasificación BANT y Pipeline Automatizado:**
  - Clasificación instantánea de `pipeline_type` (`VENTAS`, `ALQUILERES`, `CAPTACIONES`), `lead_type` (`BUYER`, `TENANT`, `SELLER_OWNER`), `payment_method` (`CREDITO_VIS`, `CREDITO_BANCARIO`, `CONTADO`) e `intent_score` calibrado (60-98).

### 🟢 Módulo de Auditoría Legal & Compliance Inmobiliario (`PropertyLegalAuditModal.tsx` & `RagInventoryView.tsx`)
* **Checklist Documental Boliviano:**
  - **1. Folio Real (DDRR):** Evaluación de gravámenes e hipotecas (`AL_DIA` vs `CON_GRAVAMEN` vs `PENDIENTE`).
  - **2. Impuestos Municipales (RUAT / Alcaldía):** Estado fiscal de la última gestión (`AL_DIA` vs `DEUDA` vs `PENDIENTE`).
  - **3. Catastro Municipal & Uso de Suelo:** Visación municipal del plano (`APROBADO` vs `EN_TRAMITE` vs `NO_TIENE` vs `PENDIENTE`).
* **Semáforo Algorítmico de Riesgo en Tiempo Real:**
  - `🟢 VERDE (Viable / Seguro)`: Cumplimiento 100% en Folio Real, Impuestos y Catastro. Apto para venta y crédito VIS/Bancario.
  - `🟡 AMARILLO (Observado / Subsanable)`: Gravámenes en trámite de levantamiento o deuda fiscal subsanable antes de minuta.
  - `🔴 ROJO (Bloqueado / Alto Riesgo)`: Sin catastro, vicios documentales graves o folio observado.
* **Persistencia Relacional en Base de Datos:**
  - Upsert y consulta directa contra la tabla `property_legal_audit` en Supabase unida a `properties` en `App.tsx`.
  - Pestañas e insignias dinámicas en la tabla de inventario y en el modal de ficha detallada.

### 🟢 Generador de Contratos Digitales & Data Binding PDF (`api/contracts/generate.ts` & `GenerateContractModal.tsx`)
* **Multi-Contrato Formal:**
  - **1. Contrato de Reserva Formal (con Arras / Señal de Trato):** Retiro de mercado, imputación a precio y plazo de vigencia.
  - **2. Promesa Bilateral de Compraventa:** Condiciones de pago, saldo financiado bancario/VIS y penalidades.
  - **3. Contrato de Consignación & Mandato Inmobiliario:** Para captación con propietarios (comisión convenida y representación).
* **Robustez & Resiliencia en PDF:**
  - Sanitizador de glifos y acentos (WinAnsi/Latin-1) para prevenir errores de rendering en fuentes PDF estándar.
  - Fallback automático a `data:application/pdf;base64` si Supabase Storage no tiene bucket público activo.
  - Conversión monetaria en tiempo real USD a Bolivianos (TC oficial 6.96).

### 🟢 Autenticación, Roles Multi-Tenant y Seguridad (`src/lib/auth.ts`, `AppHeader.tsx`)
* **Jerarquía de Roles Estricta:**
  - `superadmin` (`rolangutiali.rg@gmail.com`): Control omnisciente del ecosistema SaaS, visor global y métricas consolidadas.
  - `agency_admin`: Control exclusivo de su organización (`organization_id`), gestión de asesores de su equipo y personalización de Sofía IA.
  - `agent`: Asesor inmobiliario operativo enfocado en gestión de leads y agendamiento.
* **Sincronización en Base de Datos:**
  - Función `fetchUserDbProfile` que enlaza el usuario autenticado con la tabla `users` y `organizations` en Supabase.

### 🟢 Gobernanza SaaS: SuperAdmin Global & Panel de Agencia (`SuperAdminPanel.tsx` & `AgencySettingsModal.tsx`)
* **Panel SuperAdmin Conectado en Tiempo Real:**
  - Listado y creación de nuevas inmobiliarias con persistencia en tabla `organizations`.
  - Conmutadores de módulos por agencia (`module_sofia_ia`, `module_bant_kanban`, `module_legal_audit`, `module_contract_generator`).
  - Métricas globales consolidadas (leads totales, propiedades, mensajes WhatsApp, latencia).
  - Editor dinámico de System Prompts y reglas de Sofía por inmobiliaria.
* **Panel de Administración de Inmobiliaria (`AgencySettingsModal`):**
  - Gestión de equipo: Invitar y administrar asesores por email.
  - Configuración de personalidad y tono de Sofía IA con inyección de reglas locales.

### 🟢 Módulo Nativo de Marketing Studio & Suite de Extensión Chrome (v2.0)
* **Componente UI Principal (`src/components/marketing/MarketingStudioView.tsx`):**
  - **1. AI Script & Prompt Generator:** Generación y descarga instantánea de `script.json` para 9:16 (TikTok/Reels) y 16:9 (Web/YouTube) con tokens de consistencia inmutable (`HR-Personaje`, `HR-Escenario`).
  - **2. Suite de Extensión Chrome Adaptada (`extension/property-content-generator`):** Integración del motor de automatización por lotes para Google Labs Flow y Vibes AI, con respeto explícito y atribución a la autoría comunitaria original (`hans1801/AI-Content-Automation-Engine`).
  - **3. Biblioteca DMO & Social Selling:** Packs de 30 días con inyección automática de datos del asesor (`{{sponsor_link}}`, `{{whatsapp_link}}`).
  - **4. Telemetría de Campañas:** Contadores en tiempo real de leads capturados por palabra clave (`CALCULAR`, `BOT`, `AUDITORIA`, `PRECIO`, `TOUR`).
* **Gobernanza Multi-Tenant en SuperAdmin (`SuperAdminPanel.tsx`):**
  - Conmutador `module_marketing_studio` añadido para control de activación/desactivación por agencia inmobiliaria.
* **Compilación y Type-Safety:** Verificado con build exitoso (0 errores en 1744 módulos).

---

## ⏳ 2. TAREAS PENDIENTES Y HOJA DE RUTA

### 🟡 1. Testing End-to-End y UAT
* Pruebas sintéticas con Facebook Lead Ads Testing Tool y simulación de webhooks de captación y venta en vivo.

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
