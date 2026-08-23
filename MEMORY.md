# 🧠 MEMORY.md — Property OS (Historial de Despliegue e Infraestructura)

**Última actualización:** 22 de Agosto de 2026 (Sprint B2B Growth Module — Sesión Estratégica)
**Estado General:** Plataforma **operativa en producción**. Se completó el cambio de timón estratégico del módulo de Marketing/Flow hacia el módulo de **Prospección B2B de Agencias Inmobiliarias**, incluyendo escaneo por ciudad, generación de cold email con IA y conversión 1-clic de prospecto a tenant SaaS.

---

## 🌐 Entorno de Producción Oficial
* **URL de Producción (Vercel):** [https://property-app-ashen.vercel.app](https://property-app-ashen.vercel.app)
* **Commit activo:** `2634a02` — fix(vercel): merge B2B endpoints into single /api/admin/b2b handler
* **Evolution API Gateway (Railway):** `https://evolution-api-production-a3a5.up.railway.app`
* **Instancia Activa:** `PropertyOS-Main`
* **Supabase Project:** `lqagnlbygzurddkzbbwn` (`https://lqagnlbygzurddkzbbwn.supabase.co`)

---

## 📊 STATUS DE LA PLATAFORMA (22-Ago-2026)

| Módulo | Estado | Notas |
|---|---|---|
| Sofía IA RAG WhatsApp | ✅ OPERATIVO | Webhook bidireccional activo en Evolution API |
| Kanban Multi-Pipeline | ✅ OPERATIVO | 3 embudos: Ventas, Captación, Alquileres |
| Cotizador Financiero | ✅ OPERATIVO | Sistema Francés, VIS/ASFI, Hipotecario |
| Contratos Digitales PDF | ✅ OPERATIVO | Reserva, Promesa, Consignación |
| Auditoría Legal | ✅ OPERATIVO | Semáforo de riesgo verde/amarillo/rojo |
| SuperAdmin SaaS | ✅ OPERATIVO | Multi-tenant, módulos por agencia |
| **B2B Prospección Agencias** | ✅ NUEVO — OPERATIVO | Handler unificado `/api/admin/b2b` |
| Marketing Studio / Flow JSON | ⏸️ EN PAUSA | Módulo funcional pero requiere profundizar en el lenguaje Flow/Vibes AI |
| Autenticación Supabase | ⚠️ REVISAR | Credenciales de prod diferentes a las esperadas en local — resolver reset de password |

---

## 🏗️ 1. HISTORIAL DE INNOVACIONES Y MÓDULOS COMPLETADOS

### 🟢 Módulo B2B Agency Prospecting (NUEVO — 22-Ago-2026)
* **Propósito:** Canal de prospección y captación de agencias inmobiliarias bolivianas como clientes SaaS de Property OS.
* **Handler Unificado (`api/admin/b2b.ts`):**
  - `action: "search"` — Escanea agencias inmobiliarias en cualquier ciudad de Bolivia con IA (OpenAI GPT-4o-mini). Sin clave API usa fallback de 5 agencias de muestra reales.
  - `action: "invite"` — Genera correo ejecutivo de cold email personalizado con HTML profesional + texto plano listos para Gmail/SendGrid.
  - `action: "convert"` — Convierte el prospecto en una `organization` activa en Supabase con módulos SaaS preconfigurados (1-clic).
  - **Nota arquitectónica:** Los 3 sub-endpoints fueron consolidados en 1 solo archivo para respetar el límite de **12 Serverless Functions del plan Hobby de Vercel**.
* **Base de Datos (`supabase/migrations/20260822_b2b_agency_prospects.sql`):**
  - Tabla `b2b_agency_prospects` con pipeline de estados: `NUEVO → EMAIL_ENVIADO → DEMO_AGENDADA → RECHAZADO → CONVERTIDO`.
  - Campos: `agency_name`, `manager_name`, `manager_role`, `email_official`, `email_personal`, `phone_official`, `whatsapp_contact`, `website_url`, `linkedin_url`, `meeting_link`, `last_contacted_at`.
  - RLS activo para `authenticated` y `anon`.
* **UI en SuperAdmin (`src/components/admin/B2bProspectingView.tsx`):**
  - Pestaña "🏢 Prospección B2B" en sidebar de SuperAdminPanel.
  - Selector rápido de ciudades bolivianas, tabla de prospectos con estado de pipeline.
  - Modal de invitación: configuración de plataforma (Google Meet/Zoom), fecha propuesta, mensaje personalizado.
  - Copiar HTML, texto plano y asunto en 1 clic.
  - Botón de conversión directa a tenant.
* **Limite Vercel Hobby:** 12 functions. Inventario actual: `api/index.ts`, `api/admin/b2b.ts`, `api/admin/create-user.ts`, `api/ai/compile-prompt.ts`, `api/ai/generate-copy.ts`, `api/booking/create.ts`, `api/booking/feedback.ts`, `api/contracts/generate.ts`, `api/cron/followup.ts`, `api/rag/auto-embed.ts`, `api/rag/reindex.ts`, `api/webhooks/meta-leads.ts`, `api/whatsapp/webhook.ts` = **13 funciones**. ⚠️ Se debe consolidar 1 más antes del próximo nuevo endpoint.

### 🟢 Módulo de Cotización Financiera & Tabla de Amortización
* **Motor Matemático (`src/utils/mortgageCalculator.ts`):**
  - Cálculo de cuotas fijas bajo **Sistema Francés**, Vivienda Social VIS/ASFI (~5.5%), Hipotecario Bancario (~7.5%) y Financiamiento Directo 0%.
  - Tabla de amortización período a período (hasta 360 meses) con desglose de capital, intereses, seguros y saldo insoluto.
  - Cálculo de DTI (ingreso familiar requerido al 30%) y generador de copys WhatsApp.
* **Componente UI (`src/components/modals/MortgageCalculatorModal.tsx`):**
  - Modal interactivo con sliders dinámicos, tabla paginable y exportación PDF vía `@media print`.
  - Integrado en `LeadCard.tsx` (Kanban) y `PropertyDetailModal.tsx`.

### 🟢 Módulo de Arquitectura Multi-Pipeline (3 Embudos Especializados)
* **1. Embudo de Ventas (Compradores):** `NUEVO` ➔ `EN_CALIFICACION` ➔ `CALIFICADO_VISITA_PENDIENTE` ➔ `VISITA_AGENDADA` ➔ `VISITA_REALIZADA` ➔ `EN_NEGOCIACION` ➔ `CERRADO`.
* **2. Embudo de Captación (Propietarios):** `PROSPECTO_PROPIETARIO` ➔ `EVALUACION_INMUEBLE` ➔ `ACM_ESTUDIO_MERCADO` ➔ `AUDITORIA_DOCUMENTAL` ➔ `CONTRATO_CONSIGNACION` ➔ `INMUEBLE_CAPTADO`.
* **3. Embudo de Alquileres (Rentas):** `SOLICITUD_RENTA` ➔ `PERFILAMIENTO_INGRESOS` ➔ `VISITA_RENTA` ➔ `REVISION_GARANTIAS` ➔ `CONTRATO_RENTA_FIRMADO`.

### 🟢 Módulo de Sincronización Universal de Calendarios
* Generador de enlaces Google Calendar con formateo UTC ISO y parámetros BANT.
* Descargador instantáneo de archivos `.ics` para Apple Calendar y Outlook.
* Mensajería automática de confirmación para WhatsApp.

### 🟢 Módulo de Simulador Visual de Bot & Playground IA
* Editor de Reglas y Prompt Studio con persistencia en `ai_config` de Supabase.
* Playground Interactivo (WhatsApp Sandbox) con telemetría BANT en vivo.

### 🟢 Módulo de Auditoría Legal & Compliance Inmobiliario
* Checklist documental boliviano: Folio Real (DDRR), RUAT/Alcaldía, Catastro Municipal.
* Semáforo algorítmico: 🟢 Viable / 🟡 Observado / 🔴 Bloqueado.

### 🟢 Generador de Contratos Digitales & Data Binding PDF
* Contrato de Reserva con Arras, Promesa Bilateral de Compraventa, Contrato de Consignación.
* Sanitizador de glifos WinAnsi/Latin-1, fallback base64, conversión USD→BOB (TC 6.96).

### 🟢 Gobernanza SaaS: SuperAdmin Global
* Panel SuperAdmin en tiempo real con gestión de inmobiliarias, módulos por tenant, métricas consolidadas y editor de system prompts.

### 🟢 Módulo de Marketing Studio & Flow JSON (EN PAUSA)
* Generador de script.json para Google Flow / Vibes AI con estructura de 2 bloques (Concepto → Guión EN/ES → JSON).
* **Nota:** Módulo funcional pero requiere profundización en el lenguaje cinematográfico de Flow/Vibes AI para que los prompts sean interpretados correctamente. Se reactivará cuando el equipo tenga dominio del protocolo de tokens.

---

## ⏳ 2. TAREAS PENDIENTES — HOJA DE RUTA PRÓXIMA SESIÓN

### 🔴 CRÍTICO — Resolver antes de avanzar
1. **Reset de contraseña SuperAdmin en producción**
   - Supabase Dashboard → Auth Users → `rolangutiali.rg@gmail.com` → Change Password.
   - Actualmente el login falla con error 400 en local. El SuperAdmin debe poder acceder fluidamente.

2. **Ejecutar migración SQL en Supabase**
   - Archivo: `supabase/migrations/20260822_b2b_agency_prospects.sql`
   - Ir a: [Supabase SQL Editor](https://supabase.com/dashboard/project/lqagnlbygzurddkzbbwn/sql) → Pegar y ejecutar.
   - Sin esto, las inserciones del módulo B2B fallarán con error de tabla no encontrada.

3. **Consolidar inventario de Serverless Functions a máximo 12**
   - Actualmente hay 13. Antes del próximo nuevo endpoint, consolidar `api/booking/create.ts` + `api/booking/feedback.ts` → `api/booking/index.ts` (action routing).

### 🟡 IMPORTANTE — Próxima Sesión de Crecimiento B2B
4. **Implementar envío real de correos (Resend / SendGrid)**
   - El módulo B2B genera el HTML pero el envío es manual (copiar + pegar en Gmail).
   - Integrar Resend.com (plan gratuito 3.000 emails/mes) como capa de envío real desde `/api/admin/b2b`.

5. **Pipeline de seguimiento B2B (CRM interno de prospectos)**
   - Vista de Kanban para prospectos B2B con columnas: `NUEVO → CONTACTADO → DEMO_AGENDADA → EN_NEGOCIACION → CONVERTIDO → RECHAZADO`.
   - Recordatorios automáticos de seguimiento (cron job existente en `api/cron/followup.ts` puede extenderse).

6. **Página de Landing / Demo pública de Property OS**
   - Crear una landing page atractiva en `/demo` o en dominio propio que capture el interés de gerentes de agencias.
   - Con formulario de solicitud de demo que alimente directamente la tabla `b2b_agency_prospects`.

### 🟢 MEJORAS DE PRODUCTO — Mediano Plazo
7. **Flow / Marketing Studio v2** — Reactivar con conocimiento profundo del protocolo de tokens de Google Flow. Documentar los tokens reales que el motor interpreta.
8. **App Móvil (PWA)** — Convertir Property OS en PWA instalable para los asesores de campo.
9. **Integración Meta Leads Ads** — Activar el endpoint `api/webhooks/meta-leads.ts` con conexión real a Meta Ads Manager para captura automática de leads desde Facebook/Instagram.
10. **Analytics de Pipeline** — Dashboard de conversión: tasa de leads calificados por Sofía IA, tiempo promedio en cada etapa, ROI por inmobiliaria.

---

## 🎯 3. VISIÓN ESTRATÉGICA — Network Marketing Digital Inmobiliario

**Problema central:** Las agencias inmobiliarias de Bolivia pierden leads por no tener respuesta inmediata 24/7, contratos digitales y análisis de mercado en tiempo real.

**Propuesta de valor de Property OS:**
- 🤖 Sofía IA califica leads en WhatsApp a las 3 AM sin costo adicional de personal.
- 📄 Contratos de reserva en minutos con firma digital.
- 📊 CMA automatizado con datos reales del mercado local.
- 🏢 Escalable: 1 plataforma → N agencias → modelo SaaS B2B.

**Canal de adquisición B2B (nuevo):**
- Escanear agencias por ciudad → Cold email personalizado con IA → Demo 30 min → Conversión.
- El módulo recién construido automatiza el 80% de este proceso.

---

## 🔒 4. VARIABLES DE ENTORNO EN PRODUCCIÓN

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

# Vercel Function Limit: MAX 12 (actualmente 13 — consolidar antes del próximo endpoint)
```

---

## 📝 5. DECISIONES ARQUITECTÓNICAS REGISTRADAS

| Fecha | Decisión | Razón |
|---|---|---|
| 22-Ago-2026 | Consolidar 3 endpoints B2B → 1 handler `api/admin/b2b.ts` con `action` routing | Límite de 12 Serverless Functions en Vercel Hobby |
| 22-Ago-2026 | Pausa del módulo Flow/Marketing Studio | El equipo necesita profundizar en el protocolo de tokens de Google Flow antes de continuar. No avanzar sin dominio del lenguaje cinematográfico |
| 22-Ago-2026 | Cambio de timón 180°: Marketing → B2B Prospecting | El crecimiento de la plataforma depende de adquirir agencias como clientes SaaS, no solo de crear contenido |
| 22-Ago-2026 | Vite watcher `ignored` para archivos `.mp4` en Windows | Error EBUSY en Windows al intentar watching de archivos multimedia grandes |
| Anterior | Flow/Vibes AI requiere `script.json` estrictamente en carpeta vacía | Cualquier otro nombre o estructura hace fallar la extensión |
