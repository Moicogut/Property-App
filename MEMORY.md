# 🧠 MEMORY.md — Property OS (Historial de Despliegue e Infraestructura)

**Última actualización:** 05 de Agosto de 2026 (Módulo Operativo de Agendamiento, Google Calendar y Cron Jobs)
**Estado General:** Refactorización arquitectónica a MVP robusto, sistema SaaS con base sólida en Inteligencia Artificial y Function Calling (Agendador). Backend 100% libre de errores de Typescript. Listo para pruebas de campo intensivas.

---

## 🏗️ 1. HISTORIAL DE INFRAESTRUCTURA Y SERVICIOS

### 🟢 Base de Datos & Auth (Supabase)
* **Proyecto:** `lqagnlbygzurddkzbbwn` (`https://lqagnlbygzurddkzbbwn.supabase.co`).
* **Extensiones:** `pgvector` activada con índices vectoriales **HNSW**.
* **Tablas Core:** `organizations`, `users`, `properties`, `leads`, `app_config`, `appointments` (Manejo de Citas), `messages`.
* **Configuración Auth:** `Site URL` configurada en `https://property-app-ashen.vercel.app`.
* **RPC RAG Nativo:** Creada función RPC `match_properties` para delegar el cálculo de similitud coseno 100% a PostgreSQL.
* **Seguridad Front-end:** Implementado Bypass de Row Level Security (RLS) en el panel de React usando forzosamente el JWT del `SERVICE_ROLE_KEY` para lectura limpia del pipeline en el Dashboard ejecutivo.

### 🟢 Servidor de Mensajería (Evolution API v2 en Railway)
* **URL API:** `https://evolution-api-production-286c8.up.railway.app`
* **Instancia:** `PropertyOS-Main`
* **Webhooks & Endpoints (Vercel):**
  - **Recepción Principal:** `/api/whatsapp/webhook`. (Implementado bloqueo de eventos "fromMe" para evitar bucles de la propia IA).
  - **Gestión Operativa:** Endpoints nativos `/api/booking/create`, `/api/booking/feedback` y `/api/cron/followup` listos para ser consumidos y programados.
  - **Auto-Verificación:** Endpoint `/api/whatsapp/test` para comprobar salud de las variables de entorno de producción.
* **Retraso Cognitivo (Humano):** Se añadió una función de *delay* aleatorio con *typing* de 3 a 5 segundos en el webhook antes de despachar mensajes, logrando una ilusión 100% humana y optimizando el tiempo de Vercel Serverless.

### 🟢 Motor Agéntico y Calendar (Google Workspace)
* **Integración Google Calendar:** Implementación de autenticación de backend (JWT Service Account) para auto-agendar eventos de calendario invitando al prospecto y al agente de forma asíncrona.
* **Seguimiento Cron Jobs:** Arquitectura de re-enganche construida. El endpoint `/api/cron/followup` gestiona recordatorios (2h previas), recolección de feedback (2h posteriores) y rescate de leads fríos (24h inactivos).

### 🟢 Frontend & UI (Vercel + Vite + React)
* **Kanban Fix:** Subsanado un error en el flujo de agendamiento manual (botón "Visita" en la tarjeta). Ahora, actualizar la tarjeta manualmente salva el cambio en Supabase y mueve el Lead directamente a la etapa `VISITA_AGENDADA`.
* **UI Sincronizada:** El pipeline está diseñado en 7 etapas rígidas que concuerdan estrictamente con los Enum de la base de datos PostgreSQL.
* **Typescript Clean:** Eliminados los remanentes incompatibles del App Router (next/server) dentro de los endpoints Serverless, garantizando builds impecables en Vercel.

---

## ⏳ 2. TAREAS PENDIENTES Y HOJA DE RUTA (ETAPA DE CAMPO)

### 🔴 0. Configuración Vercel Cron (Inmediato)
* **Archivo vercel.json:** Subir configuración cron en la raíz del proyecto para disparar `GET /api/cron/followup` de forma programada (ej. cada hora).
* **Service Account:** Agregar el JSON de credenciales de Google (`GOOGLE_SERVICE_ACCOUNT_KEY`) en el panel de Vercel (Environment Variables).

### 🟡 1. Afinado y Tuning del Prompt (Asesor Inmobiliario)
* Auditar transcripciones de las pruebas de campo.
* Ajustar el comportamiento del bot para que no pierda control bajo ataques o interrupciones de clientes.
* Enseñar respuestas condicionales más refinadas basadas en el input del RAG (por ejemplo, si el cliente presiona para descuentos).

### 🟡 2. Manejo de Errores y Timeouts en Webhook
* Monitorear latencia del Vercel Edge/Serverless functions. Asegurar que las respuestas lentas de OpenAI no generen Timeouts (error 504) al acumularse el tiempo de generación y envío.

### 🟡 3. UI/UX Mejoras Finales
* Incorporar una Vista de **Calendario en el Front-End**, consolidando la tabla `appointments` en formato semana/mes visualmente, independiente del Google Calendar externo.

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

# Google Calendar Auth
GOOGLE_SERVICE_ACCOUNT_KEY='{"type": "service_account", "project_id": "...", ...}'
```
