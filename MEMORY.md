# 🧠 MEMORY.md — Property OS (Historial de Despliegue e Infraestructura)

**Última actualización:** 03 de Agosto de 2026 (Property OS v2 Refactor)
**Estado General:** Refactorización arquitectónica a PMV robusto y SaaS escalable (Completada).

---

## 🏗️ 1. HISTORIAL DE INFRAESTRUCTURA Y SERVICIOS

### 🟢 Base de Datos & Auth (Supabase)
* **Proyecto:** `lqagnlbygzurddkzbbwn` (`https://lqagnlbygzurddkzbbwn.supabase.co`).
* **Extensiones:** `pgvector` activada con índices vectoriales **HNSW** para embeddings de **768d** (Migración a Gemini v2).
* **Tablas:** `organizations`, `users`, `properties`, `leads`, `leads_piloto`, `app_config` (NUEVO).
* **Configuración Auth:** 
  * `Site URL` configurada en `https://property-app-ashen.vercel.app`.
* **RPC RAG Nativo:** Creada función RPC `match_properties` que delega 100% de la similitud coseno a PostgreSQL.

### 🟢 Servidor de Mensajería (Evolution API v2 en Railway)
* **URL API:** `https://evolution-api-production-286c8.up.railway.app`
* **Instancia:** `PropertyOS-Main`
* **Número vinculado:** WhatsApp corporativo (`+591 78756107` / Moisés R. Gutierrez A.).
* **Webhook:** Activo apuntando al backend Express `/api/whatsapp/webhook`.
* **Procesamiento de IA:** Integrado el flujo de Gemini LLM ("Sofía") con contexto inyectado directo de Supabase vía RPC.

### 🟢 Backend (Node.js/Express)
* **Refactor (Server & Webhook):** Se eliminó por completo el motor de base de datos en RAM (`memoryStore`) y el cálculo de similitud coseno local. 
* **API Endpoints (`server.ts`):** Todos los endpoints (leads, properties, webhook) operan con transacciones en Supabase.
* **Embeddings (Strategy Pattern):** Se implementó una fábrica en `src/lib/embeddings` que soporta `Google Gemini (text-embedding-004, 768d)` como proveedor primario y `OpenAI (text-embedding-3-small, 768d)` como fallback secundario. Configurable dinámicamente vía la tabla `app_config`.

### 🟢 Frontend & Deploy (Vercel + Vite + React)
* **Single Source of Truth:** La UI (`App.tsx`) ya no utiliza arrays locales de pruebas. Se nutre 100% mediante peticiones y un `useEffect` que carga `leads` y `properties` desde Supabase.
* **Supabase Realtime:** Suscripción activa al canal de la tabla `leads` en `App.tsx` para refrescar la UI Kanban instantáneamente sin F5.
* **SuperAdmin Panel:** Métricas actualizadas de 1536d a 768d para reflejar el uso de Gemini.

---

## ⏳ 2. PENDIENTES Y HOJA DE RUTA (NEXT STEPS)

### 🟡 Despliegue de Cambios (DB)
* **Situación:** Se generó la migración `20260803_v2_gemini_768.sql` con el vector(768) e índices de Gemini.
* **Acción para ejecución:** El administrador de DB debe ejecutar este SQL manualmente en el SQL Editor de Supabase en producción antes de correr el seeding (o si ya se corrió, verificar).

### 🟡 Seeding V2 (Gemini)
* Ejecutar el script `src/db/seed.ts` (asegurándose que exista `GEMINI_API_KEY` en el `.env`) para reinsertar las propiedades con embeddings 768d generados por Gemini en lugar de OpenAI.

### 🟡 Despliegue Vercel
* Subir los cambios a GitHub/Vercel (push) para validar el build (`npm run build` ya testeado localmente mediante `npx tsc --noEmit`).
* Configurar variables de entorno (`GEMINI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`) en el panel de Vercel.

---

## 🔒 3. VARIABLES DE ENTORNO REQUERIDAS (`.env.local` / Vercel)

```env
# Supabase
VITE_SUPABASE_URL="https://lqagnlbygzurddkzbbwn.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbG..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbG..."

# Embeddings (Patrón Strategy)
GEMINI_API_KEY="AIzaSy..."
OPENAI_API_KEY="sk-proj-..."

# Evolution API
EVOLUTION_API_URL="https://evolution-api-production-286c8.up.railway.app"
EVOLUTION_API_KEY="a2bf..."
EVOLUTION_INSTANCE_NAME="PropertyOS-Main"
```
