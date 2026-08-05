# 🧠 MEMORY.md — Property OS (Historial de Despliegue e Infraestructura)

**Última actualización:** 04 de Agosto de 2026 (Property OS MVP Completo - Inicio de Fase de Campo)
**Estado General:** Refactorización arquitectónica a MVP robusto, sistema SaaS con base sólida en Inteligencia Artificial y Function Calling (Agendador). Listo para pruebas de estrés.

---

## 🏗️ 1. HISTORIAL DE INFRAESTRUCTURA Y SERVICIOS

### 🟢 Base de Datos & Auth (Supabase)
* **Proyecto:** `lqagnlbygzurddkzbbwn` (`https://lqagnlbygzurddkzbbwn.supabase.co`).
* **Extensiones:** `pgvector` activada con índices vectoriales **HNSW**.
* **Tablas Core:** `organizations`, `users`, `properties`, `leads`, `app_config`, `appointments` (NUEVO).
* **Configuración Auth:** `Site URL` configurada en `https://property-app-ashen.vercel.app`.
* **RPC RAG Nativo:** Creada función RPC `match_properties` para delegar el cálculo de similitud coseno 100% a PostgreSQL.
* **Seguridad Front-end:** Implementado Bypass de Row Level Security (RLS) en el panel de React usando forzosamente el JWT del `SERVICE_ROLE_KEY` para lectura limpia del pipeline en el Dashboard ejecutivo.

### 🟢 Servidor de Mensajería (Evolution API v2 en Railway)
* **URL API:** `https://evolution-api-production-286c8.up.railway.app`
* **Instancia:** `PropertyOS-Main`
* **Número vinculado:** WhatsApp corporativo (`+591 78756107` / Moisés R. Gutierrez A.).
* **Webhook (Vercel):** Activo apuntando a `/api/whatsapp/webhook`.
  - *Fix (05/Ago):* Se eliminó el bloqueo estricto 401 que descartaba eventos de Evolution API por falta de cabecera `apikey`, logrando compatibilidad directa.
  - *Diagnóstico (05/Ago):* Se creó el endpoint oculto `/api/whatsapp/test` para auto-verificación en vivo de variables de entorno de producción.
* **Procesamiento de IA:** Integrado OpenAI y Gemini de forma intercambiable. (Actualmente operando estable con OpenAI para manejo de memoria y contexto).
* **Retraso Cognitivo (Humano):** Se añadió una función de *delay* aleatorio en el webhook antes de despachar mensajes, logrando una ilusión de "escribiendo..." humana, optimizado para evitar Timeouts de 10s en Vercel Serverless.

### 🟢 Motor Agéntico y Tools (Function Calling)
* **Skill - Agendar Visita:** El cerebro del bot ha sido dotado con la función `agendar_visita(fecha, hora)`. Cuando detecta que el usuario quiere agendar, llama a esta herramienta, guardando la cita en la tabla `appointments` y modificando el estatus del Lead a `VISITA_AGENDADA`.

### 🟢 Frontend & UI (Vercel + Vite + React)
* **Single Source of Truth:** La UI (`App.tsx`) se nutre directamente desde Supabase en tiempo real.
* **Kanban Completo:** Etapas sincronizadas que abarcan desde NUEVO hasta AGENDA y CERRADO.
* **Acciones en Kanban:** Posibilidad de Editar Nombres de cliente (✏️) y Borrar leads y su historial (🗑️) mediante accesos rápidos en la tarjeta.
* **Tarjetas Inteligentes:** Muestran un banner visual en color esmeralda cuando el cliente agendó una visita, indicando la fecha y hora.
* **SuperAdmin Panel (KPIs):** Las métricas incluyen el conteo correcto de clientes en pipeline, ratio de autogestión y conteo de Citas VIS agendadas por la IA.

---

## ⏳ 2. TAREAS PENDIENTES Y HOJA DE RUTA (ETAPA DE CAMPO)

El sistema ahora entra en fase de pruebas intensivas en campo, la hoja de ruta para las siguientes mejoras incluirá:

### 🔴 0. Auditoría de Despliegue (Urgente - Siguiente Sesión)
* Utilizar el endpoint de diagnóstico (`/api/whatsapp/test`) para verificar el estado de las credenciales de Vercel.
* Revisar el panel de Evolution API Manager para confirmar que el evento `MESSAGES_UPSERT` esté efectivamente marcado en ON, garantizando el flujo de datos.

### 🟡 1. Afinado y Tuning del Prompt (Asesor Inmobiliario)
* Auditar transcripciones de las pruebas de campo.
* Ajustar el comportamiento del bot para que no pierda control bajo ataques o interrupciones de clientes.
* Enseñar respuestas condicionales más refinadas basadas en el input del RAG (por ejemplo, si el cliente presiona para descuentos).

### 🟡 2. Manejo de Errores y Timeouts en Webhook
* Monitorear latencia del Vercel Edge/Serverless functions. Asegurar que las respuestas lentas de OpenAI no generen Timeouts (error 504).
* Mover el disparo de WhatsApp a un Job asíncrono (Background o Queues) si Vercel aborta ejecuciones largas en la versión gratuita.

### 🟡 3. UI/UX Mejoras Finales
* Reemplazar los `window.prompt` de React por un UI Component nativo (Modales en Tailwind).
* Incorporar una Vista de **Calendario en el Front-End**, consolidando la tabla `appointments` en formato semana/mes.

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
```
