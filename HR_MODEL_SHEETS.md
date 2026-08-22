# 🎨 Hojas de Referencia Multimodal (@ Flow) — Property OS

**Versión:** 2.5 — Oficial Multimodal Flow  
**Subagentes Responsables:** `flow-director` & `creative-scriptwriter`  
**Compatibilidad:** Google Labs Flow, Google Veo 2, Vibes AI, Runway Gen-3  
**Estatus:** ✅ Sistema de 5 Slots de Referencia con Tokens `@` Activo  

---

## 🏛️ 1. Matriz de 5 Slots de Referencia Multimodal en Flow

| Slot | Token en Prompt | Archivo Oficial Subido | Propósito en Flow |
| :--- | :--- | :--- | :--- |
| **Slot 1 (Modelo Principal)** | `@HRP Modelo WARA 02.jpeg` | `HRP Modelo WARA 02.jpeg` | Continuidad facial 100%, cabello con reflejos rojizos, blazer negro entallado. |
| **Slot 2 (Modelo Secundario)** | `@HRP Cliente COMPRADOR.jpeg` | *(Opcional)* | Segundo actor para escenas de apretón de manos o cierre de trato. |
| **Slot 3 (Branding / Logo)** | `@logo.a.png` | `logo.a.png` | Isotipo 3D dorado de Property OS para sellos y pantallas. |
| **Slot 4 (Escenario / Set)** | `@ático SCZ 01.jpg` | `ático SCZ 01.jpg` | Balcón y penthouse ejecutivo en Santa Cruz con bokeh de rascacielos. |
| **Slot 5 (Producto / UI)** | `@UI_Cotizador_VIS.png` | `UI_Cotizador_VIS.png` | Pantalla de la tablet/smartphone con interfaz de Property OS / Sofía IA. |
| **Slot 6 (Afiche Promocional)** | `@Afiche_48000_USD.png` | `Afiche_48000_USD.png` | Banner publicitario con precios y cuotas VIS. |

---

## 🎥 2. Muestra de Referencia Oficial (Golden Sample)

* **Archivo Local:** [`/public/video_prueba.1.mp4`](file:///c:/Files%20ECOTRAFFIC%20A8/PROYECTOS%202026/PROPERTY/Property%20app/public/video_prueba.1.mp4)
* **Duración:** 10 segundos continuos (9:16 vertical, 1080x1920).
* **Audio:** Español neutro con sincronización labial (Lip-sync).
* **Guión Oficial:**
  > *"Hola. Te presento a Sofía IA. Ella califica tus leads. Usa la metodología BANT. Así optimizas tu tiempo real. Agenda una demostración hoy."*

---

## 🎬 3. Modo de Operación con Google Labs Flow

1. Abrir **Google Labs Flow** (`https://labs.google/flow`).
2. Subir los archivos de referencia a la biblioteca de assets del proyecto (`HRP Modelo WARA 02.jpeg`, `logo.a.png`, `ático SCZ 01.jpg`).
3. En la consola de **Marketing Studio**, seleccionar la escena y copiar el prompt compilado o descargar [`script.json`](file:///c:/Files%20ECOTRAFFIC%20A8/PROYECTOS%202026/PROPERTY/Property%20app/script.json).
4. Iniciar la generación individual o por lotes con la extensión de Chrome.
