# 🎨 Hojas de Referencia de Producción Audiovisual (HR Model Sheets) — Property OS

**Versión:** 1.0 — Oficial  
**Subagentes Responsables:** `flow-director` & `creative-scriptwriter`  
**Compatibilidad:** Google Labs Flow, Google Veo 2, Midjourney v6, Vibes AI, Runway Gen-3  
**Estatus:** ✅ Anclaje Inmutable Aprobado  

---

## 🏛️ 1. Hoja de Referencia: Personaje Ancla (`HR-Personaje`)

Para garantizar **100% de continuidad facial y vestimenta** en todos los clips generados por IA:

```
┌───────────────────────────┬────────────────────────────────────────────────────────────────────────┐
│ PARÁMETRO                 │ ESPECIFICACIÓN INMUTABLE                                               │
├───────────────────────────┼────────────────────────────────────────────────────────────────────────┤
│ **Identidad / Rol**       │ Asesor Inmobiliario Senior & Partner Tecnológico Property OS           │
│ **Rango de Edad & Rasgos**│ 32-35 años, cabello castaño oscuro corto y peinado pulcro, mirada      │
│                           │ empática y segura, complexión atlética profesional.                    │
│ **Vestimenta Exacta**     │ Traje sastre entallado en color **Obsidian Black (`#0B0D12`)**,        │
│                           │ camisa blanca marfil sin corbata, sutil pin metálico dorado en la      │
│                           │ solapa izquierda (**Champagne Gold `#D4AF37`**).                       │
│ **Accesorios Fijos**      │ Tablet de cristal con bisel ultrafino y reloj minimalista metálico.    │
└───────────────────────────┴────────────────────────────────────────────────────────────────────────┘
```

* **Token de Continuidad en Prompts:**
  `"Same 33-year-old professional latino male real estate advisor, short neat dark hair, wearing an impeccably tailored obsidian black suit with an open-collar ivory shirt and a subtle gold lapel pin, confident expression."`

---

## 🏙️ 2. Hoja de Referencia: Escenario e Iluminación (`HR-Escenario`)

```
┌───────────────────────────┬────────────────────────────────────────────────────────────────────────┐
│ PARÁMETRO                 │ ESPECIFICACIÓN INMUTABLE                                               │
├───────────────────────────┼────────────────────────────────────────────────────────────────────────┤
│ **Ubicación Principal**   │ Sala de reuniones de penthouse ejecutivo contemporáneo con ventanal de │
│                           │ piso a techo y vista urbana desenfocada (bokeh cinematográfico).       │
│ **Paleta de Color del Set**│ Fondo en tonalidades oscuras grafito y madera nogal (**`#111622`**),    │
│                           │ con detalles cálidos tenues.                                           │
│ **Esquema de Iluminación**│ **Key Light:** Luz principal 5600K balanceada y difusa a 45°.          │
│                           │ **Rim Light:** Luz de contorno dorado cálido (**`#D4AF37`**) a 3200K.  │
│ **Cámara & Óptica**       │ Lente 50mm / 85mm con apertura $f/1.8$, profundidad de campo reducida. │
└───────────────────────────┴────────────────────────────────────────────────────────────────────────┘
```

* **Token de Iluminación en Prompts:**
  `"Modern luxury penthouse office background with soft cinematic city bokeh, key light 5600K diffused, subtle 3200K champagne gold rim lighting on shoulders, shot on 50mm lens f/1.8, 8k resolution."`

---

## 💻 3. Hoja de Referencia: UI & Producto (`HR-Producto`)

```
┌───────────────────────────┬────────────────────────────────────────────────────────────────────────┐
│ ELEMENTO VISUAL           │ ESPECIFICACIÓN TÉCNICA                                                 │
├───────────────────────────┼────────────────────────────────────────────────────────────────────────┤
│ **Dispositivo**           │ Tablet de cristal futurista / Laptop ultrafina de aluminio espacial.   │
│ **Pantalla de la App**    │ Interfaz oscura (Dark Mode) de Property OS: logotipo con "y" dorada,   │
│                           │ gráfica interactiva de cuotas VIS, semáforo verde de Folio Real y      │
│                           │ badges de telemetría BANT en esmeralda (`#10B981`) y oro (`#D4AF37`).   │
└───────────────────────────┴────────────────────────────────────────────────────────────────────────┘
```

---

## 🚫 4. Prompt Negativo Maestro (Estandarizado)

Utilizar siempre en el motor de renderizado:

```text
morphing, sudden outfit change, distorted face, jitter, flicker, low resolution, cartoon, 3d render, extra hands, missing fingers, deformed eyes, washed out colors, overexposed, low quality, glitch, watermark, blurry background artifacts.
```

---

## 🎬 5. Modo de Operación con Extensión de Chrome

1. Abrir **Google Labs Flow** o **Vibes AI**.
2. Abrir la extensión **AI Content Generator**.
3. Cargar el archivo [`script.json`](file:///c:/Files%20ECOTRAFFIC%20A8/PROYECTOS%202026/PROPERTY/Property%20app/script.json).
4. Activar renderizado por lotes (Batch Mode).
