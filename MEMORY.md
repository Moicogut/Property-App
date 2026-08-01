# 🧠 MEMORY.md — Property OS (Historial de Despliegue e Infraestructura)

**Última actualización:** Agosto 2026  
**Estado General:** Infraestructura backend y frontend 100% activa en producción.

---

## 🏗️ 1. HISTORIAL DE INFRAESTRUCTURA Y SERVICIOS

### 🟢 Base de Datos & Auth (Supabase)
* **Proyecto:** `lqagnlbygzurddkzbbwn` (`https://lqagnlbygzurddkzbbwn.supabase.co`).
* **Extensiones:** `pgvector` activada con índices vectoriales **HNSW** para embeddings de 1536d.
* **Tablas:** `organizations`, `users`, `properties`, `leads`, `leads_piloto`.
* **Configuración Auth:** 
  * `Site URL` configurada en `https://property-app-ashen.vercel.app`.
  * `Redirect URLs` con comodín `https://property-app-ashen.vercel.app/**`.
* **SuperAdmin:** Rol concedido a `rolangutiali.rg@gmail.com`.

### 🟢 Servidor de Mensajería (Evolution API v2 en Railway)
* **URL API:** `https://evolution-api-production-286c8.up.railway.app`
* **Instancia:** `PropertyOS-Main`
* **Número vinculado:** WhatsApp corporativo (`+591 78756107` / Moisés R. Gutierrez A.).
* **Estado:** `Connected` (Verde).
* **Integration:** `WHATSAPP-BAILEYS` (Ecosistema estándar sin costo de Meta API).
* **Webhook:** Activo apuntando a `https://property-app-ashen.vercel.app/api/whatsapp/webhook` en evento `MESSAGES_UPSERT`.

### 🟢 Frontend & Deploy (Vercel + Vite + React)
* **URL Producción:** `https://property-app-ashen.vercel.app`
* **Diseño / UI:** Paleta Navy / Emerald (`#0F172A` / `#10B981`).
* **Correcciones Críticas de Build:**
  * **Top-Level Hooks:** Refactorización total en `src/App.tsx` eliminando violation rule #310 (Hook invocation post early return).
  * **Singleton Supabase:** Creado cliente blindado en `src/lib/supabase.ts` con fallback estático para `VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`.
  * **TypeScript:** Verificación estricta con `npx tsc --noEmit` superada en 0 errores.

---

## ⏳ 2. PENDIENTES Y HOJA DE RUTA (NEXT STEPS)

### 🔴 Ingesta Vectorial RAG (Prioridad Alta)
* **Situación:** Las 10 propiedades del Eje Troncal (Equipetrol, Urubó, Sirari, Calacoto, Obrajes, Cala Cala, etc.) están insertadas en la DB Supabase, pero sus columnas `embedding` están en `null` debido al límite de créditos en la API de OpenAI (`credit_balance_exhausted`).
* **Acción para ejecución:**
  1. Recargar saldo en [platform.openai.com/settings/organization/billing](https://platform.openai.com/settings/organization/billing).
  2. Ejecutar `npm run seed` desde terminal local para procesar los textos con `text-embedding-3-small` e inyectar los vectores a la columna `embedding`.

### 🟡 Pruebas End-to-End de "Sofía" (WhatsApp Bot)
* Realizar envío de mensaje de prueba desde un número externo hacia `+591 78756107`.
* Confirmar el flujo completo:
  WhatsApp -> Evolution API -> Webhook Vercel -> Vector Match (Supabase) -> Respuesta RAG (OpenAI)

---

## 🔒 3. VARIABLES DE ENTORNO REQUERIDAS (`.env.local` / Vercel)

```env
# Supabase
VITE_SUPABASE_URL="https://lqagnlbygzurddkzbbwn.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# OpenAI
OPENAI_API_KEY="sk-proj-..."

# Evolution API
EVOLUTION_API_URL="https://evolution-api-production-286c8.up.railway.app"
EVOLUTION_API_KEY="a2bf8aaaec21a9806766c4a536c75e716d1480feff6f9705697bf626e8fab135"
EVOLUTION_INSTANCE_NAME="PropertyOS-Main"
```
