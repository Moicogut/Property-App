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
* **Refactoring de `App.tsx`:** Descompuesto el monolito gigante (1000+ líneas) en componentes independientes de layout y features:
  - `AppHeader.tsx`
  - `KanbanBoard.tsx`
  - `LeadCard.tsx`
* **Fixes de Renderizado:** Eliminados los fallback estáticos hardcodeados ("Equipetrol", "$85,000 USD"). Ahora toda la vista del Kanban refleja en tiempo real el BANT score evaluado por el webhook.

---

## ⏳ 2. TAREAS PENDIENTES Y HOJA DE RUTA (PRÓXIMAS SESIONES)

### 🟡 Fase 1: Motor SaaS y Marketing (Próximo Sprint)
* **Módulo de Social Marketing:**
  - Crear interfaz en el Panel Admin para conectar cuentas de Meta (Facebook/Instagram).
  - Integrar webhook para recibir leads nativos de Facebook Lead Ads directamente al Kanban de Property OS (asignando `source_channel = facebook_ads`).
* **Panel SuperAdmin de Módulos:**
  - UI interactiva para encender/apagar (`module_social_marketing`, `module_legal_audit`, etc.) modificando el JSONB `modules` en Supabase por Inmobiliaria.
* **Auditoría y Analytics de Agentes:**
  - Interfaz de reportes que cruce el BANT Score con los cierres efectivos para evaluar el rendimiento de los agentes humanos vs. calificación IA.

### 🟡 Fase 2: Auditoría Legal y Cierres
* **Contract Generator:** Generación automatizada de PDFs o DOCXs inyectando los datos del comprador y vendedor.
* **Checklist Legal:** Tarjeta de Lead expandida con hitos de validación legal (Derechos Reales, Impuestos, Gravámenes).

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
