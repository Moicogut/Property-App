# 🛠️ Guía Operativa de Tareas para el Equipo Humano — Property OS

**Versión:** 1.0 — Oficial  
**Coordinación:** Director (`agents/director/agent.md`)  
**Estatus:** ✅ Tareas Concretas de Ejecución Inmediata  

Esta guía define con precisión qué debes hacer tú en cada fase como operador del sistema para poner en marcha la maquinaria de marketing, video y prospección.

---

## 🎯 Mapa de Responsabilidades (Humano + Agentes IA)

```
┌────────────────────────────────────────────────────────┬────────────────────────────────────────────────────────┐
│ 🤖 QUÉ HACEN LOS AGENTES DE IA (Ya Completado)        │ 👤 QUÉ DEBES HACER TÚ (Operador Humano)                │
├────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────┤
│ • Generar los guiones y prompts (`script.json`).       │ 1. Cargar el JSON en la extensión de Chrome.           │
│ • Definir la consistencia visual (`HR_MODEL_SHEETS`).  │ 2. Descargar los clips generados en Google Flow.       │
│ • Diseñar los árboles de DMs (`DM_CONVERSATION_FLOWS`).│ 3. Copiar las palabras clave en ManyChat / Meta.       │
│ • Calificar los leads 24/7 en WhatsApp (Sofía IA).     │ 4. Publicar 1 Reel diario y ejecutar rutina DMO (20m). │
│ • Calcular cuotas VIS y generar contratos PDF.         │ 5. Realizar las visitas presenciales y firmar cierres. │
└────────────────────────────────────────────────────────┴────────────────────────────────────────────────────────┘
```

---

## 📋 Tareas Concretas Paso a Paso

---

### 🔹 TAREA 1: Renderizar el Primer Lote de Videos (Tiempo estimado: 15 min)
* **Herramientas a usar:** Google Chrome, Extensión **AI Content Generator**, Google Labs Flow o Vibes AI.
* **Pasos a ejecutar:**
  1. Abre **Google Labs Flow** (`labs.google/flow`) o **Vibes AI** en tu navegador.
  2. Haz clic en el ícono de la extensión **AI Content Generator** en la barra superior de Chrome.
  3. Carga el archivo [`script.json`](file:///c:/Files%20ECOTRAFFIC%20A8/PROYECTOS%202026/PROPERTY/Property%20app/script.json) que acabamos de crear en la raíz del proyecto.
  4. Presiona **"Start Generation / Iniciar Lote"**.
  5. La extensión procesará automáticamente las 7 escenas (una por cada día de la semana). Descarga los 7 videos generados en formato MP4 (9:16).

---

### 🔹 TAREA 2: Montaje Rápido en CapCut o Canva (Tiempo estimado: 20 min)
* **Herramientas a usar:** CapCut (PC o Móvil) / Canva.
* **Pasos a ejecutar:**
  1. Importa los clips MP4 descargados.
  2. Activa **"Auto-Captions / Subtítulos Automáticos"** con estilo dinámico (tipografía gruesa, palabras en amarillo/dorado o esmeralda).
  3. Inserta al final del video (últimos 4 segundos) una placa fija con tu llamada a la acción:
     > *"Comenta **CALCULAR** para enviarte el simulador a tu WhatsApp"* (o la palabra clave del día).
  4. Exporta los 7 videos listos para publicar (1 para cada día de la semana).

---

### 🔹 TAREA 3: Configurar los Triggers Automáticos en ManyChat / Instagram (Tiempo estimado: 15 min)
* **Herramientas a usar:** ManyChat / Meta Business Suite.
* **Pasos a ejecutar:**
  1. Inicia sesión en **ManyChat** y conecta tu cuenta de Instagram / Facebook.
  2. Ve a la sección **Automation ➔ New Flow**.
  3. Copia y pega las ramas de [`DM_CONVERSATION_FLOWS.json`](file:///c:/Files%20ECOTRAFFIC%20A8/PROYECTOS%202026/PROPERTY/Property%20app/DM_CONVERSATION_FLOWS.json):
     * **Disparador 1:** Si alguien comenta `CALCULAR` o `VIS` ➔ Enviar enlace del Cotizador Financiero.
     * **Disparador 2:** Si alguien comenta `BOT` o `SISTEMA` ➔ Enviar enlace del Simulador de Sofía IA.
     * **Disparador 3:** Si alguien comenta `AUDITORIA` ➔ Enviar enlace del Semáforo Legal.
     * **Disparador 4:** Si alguien comenta `PRECIO` ➔ Solicitar zona y m² para estudio ACM.
     * **Disparador 5:** Si alguien comenta `TOUR` ➔ Enviar enlace de la ficha técnica del inmueble.
  4. Guarda y activa los flujos.

---

### 🔹 TAREA 4: Rutina Diaria DMO — 20 Minutos al Día
* **Horario sugerido:** 12:30 PM o 07:30 PM.
* **Pasos a ejecutar:**
  1. **Publicar el Reel del día** en Instagram y TikTok (siguiendo el orden de [`SOCIAL_MEDIA_CONTENT_ACTION_PLAN.md`](file:///c:/Files%20ECOTRAFFIC%20A8/PROYECTOS%202026/PROPERTY/Property%20app/SOCIAL_MEDIA_CONTENT_ACTION_PLAN.md)).
  2. **Publicar 2 a 3 Historias de contexto** (ej. foto de la laptop con la app abierta o una encuesta: *"¿Prefieres cuota baja o entrega inmediata?"*).
  3. **Revisar la bandeja de DMs:** El bot responderá automáticamente, pero cuando un cliente responda con su número o ciudad, Sofía IA tomará el control o tú podrás intervenir con un mensaje de voz cálido.

---

### 🔹 TAREA 5: Monitoreo en Property OS y Cierre de Citas
* **Herramientas a usar:** [Property OS en Producción](https://property-app-ashen.vercel.app).
* **Pasos a ejecutar:**
  1. Entra al **Kanban de Property OS** y verifica las nuevas tarjetas creadas en la columna `NUEVO` o `EN_CALIFICACION`.
  2. Revisa el **Score BANT** (temperatura de 0 a 100) que Sofía IA le asignó al prospecto.
  3. Haz clic en **"📅 Agendar Visita"** para sincronizar la cita en Google Calendar y enviar la confirmación con GPS al WhatsApp del cliente.
  4. Tras la visita presencial, si el cliente desea reservar, haz clic en **"💎 Emitir Contrato Digital"** para generar la Promesa de Compraventa o Reserva formal con arras en PDF.

---

## ✅ Resumen del Checklist Diario

- [ ] **Lunes:** Renderizar/publicar video VIS + revisar leads de cuotas en Kanban.
- [ ] **Martes:** Publicar video Sofía IA + revisar contactos de brokers/agencias interesadas.
- [ ] **Miércoles:** Publicar video Semáforo Legal + responder consultas de documentación.
- [ ] **Jueves:** Publicar video ACM Precio + captar 1 nuevo propietario para el pipeline.
- [ ] **Viernes:** Publicar video B2B Asesores + invitar a 3 colegas al programa de embajadores.
- [ ] **Sábado:** Publicar video Tour Departamento + realizar visitas presenciales agendadas.
- [ ] **Domingo:** Publicar historias de encuestas y planificar la semana entrante.
