import React, { useState } from "react";
import {
  Sparkles,
  Download,
  Copy,
  Check,
  Film,
  MessageSquare,
  Plus,
  RotateCcw,
  Volume2,
  User,
  Users,
  Loader2,
  Wand2,
  Edit3,
  Tag,
  Code2,
  Smartphone,
  Monitor,
  Clock,
  Layers,
  Clapperboard
} from "lucide-react";
import type { AppUser, Lead } from "@/src/types/property";

interface MarketingStudioViewProps {
  currentUser: AppUser;
  leads?: Lead[];
}

export interface CharacterDialogue {
  character: string;
  dialogue: string;
}

export interface SequenceShot {
  shot_number: number;
  shot_type: string;
  duration_seconds: number;
  guion_es: string;
  prompt_en: string;
  image_prompt: string;
  audio_dialogues: CharacterDialogue[];
}

const PRESET_THEMES = [
  "Crédito VIS & Cuotas ($285/mes)",
  "Sofía IA Calificando a las 2:30 AM",
  "Semáforo Legal & Folio Real",
  "Estudio ACM & Valuación de Inmuebles",
  "Tour Departamento $65,000",
  "Asesor Tradicional vs. Asesor con Property OS",
  "DMO Social Selling & Objeciones",
];

const PRESET_ELEMENTS = [
  { id: "logo", label: "Logo (@logo)" },
  { id: "afiche", label: "Afiche Publicitario (@afiche)" },
  { id: "sala", label: "Sala de Estar (@sala)" },
  { id: "cocina", label: "Cocina Abierta (@cocina)" },
  { id: "baño", label: "Baño (@baño)" },
  { id: "atico", label: "Ático / Penthouse (@atico)" },
  { id: "terraza", label: "Terraza / Balcón (@terraza)" },
  { id: "dormitorio", label: "Dormitorio (@dormitorio)" },
  { id: "smartphone", label: "Smartphone (@smartphone)" },
  { id: "tablet", label: "Tablet con Cotizador (@tablet)" },
  { id: "laptop", label: "Laptop CRM (@laptop)" },
  { id: "pantalla", label: "Pantalla Holográfica (@holograma)" },
];

export const MarketingStudioView: React.FC<MarketingStudioViewProps> = () => {
  // ── BLOQUE 1: Configuración de la Idea y Parámetros ──
  const [ideaText, setIdeaText] = useState<string>(
    "Dos asesores (Wara y Rolo) conversan en el ático sobre cómo comprar un departamento de $48,000 con Crédito VIS al 5.5% regulado, mostrando en la tablet que la cuota de $285/mes es menor al alquiler, cerrando en la terraza panorámica."
  );
  const [selectedTheme, setSelectedTheme] = useState<string>("Crédito VIS & Cuotas ($285/mes)");
  const [customTheme, setCustomTheme] = useState<string>("");
  const [isCustomThemeMode, setIsCustomThemeMode] = useState<boolean>(false);

  // Modo de Producción: Secuencia Conectada (10s c/u) vs Toma Única
  const [productionMode, setProductionMode] = useState<"sequence" | "single">("sequence");
  const [shotCount, setShotCount] = useState<number>(3); // 2, 3 o 4 tomas continuas de 10s

  // Personajes (1 a 4)
  const [characterCount, setCharacterCount] = useState<number>(2);
  const [characterNames, setCharacterNames] = useState<string[]>([
    "Asesora Senior (Wara)",
    "Asesor Senior (Rolo)",
    "Cliente Comprador",
    "Inversionista"
  ]);

  // Elementos activos
  const [selectedElements, setSelectedElements] = useState<string[]>([
    "Logo (@logo)",
    "Tablet con Cotizador (@tablet)",
    "Ático / Penthouse (@atico)",
    "Terraza / Balcón (@terraza)"
  ]);
  const [customElementInput, setCustomElementInput] = useState<string>("");

  // Formato y Ciudad
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "16:9">("9:16");
  const [targetCity, setTargetCity] = useState<string>("Santa Cruz");
  const [forceSpanishAudio, setForceSpanishAudio] = useState<boolean>(true);

  // ── BLOQUE 2: Resultados de la Secuencia de Continuidad ──
  const [shots, setShots] = useState<SequenceShot[]>([
    {
      shot_number: 1,
      shot_type: "Toma 1: Master Two-Shot / Hook (00:00 - 00:10)",
      duration_seconds: 10,
      guion_es: "Plano conjunto medio en el @atico de Santa Cruz: Wara (@personaje_1) con blusa borgoña abre la conversación mirando a cámara, mientras Rolo (@personaje_2) en blazer azul marino sostiene la @tablet con el @logo.",
      prompt_en: "Cinematic vertical 9:16 medium two-shot (1080x1920) of @personaje_1 in burgundy top and @personaje_2 in navy suit holding a glass @tablet with official @logo inside @atico in Santa Cruz, soft 5600K key light, 3200K rim lighting, 24fps motion, Audio: Native clear neutral Latin American Spanish voiceover speaking strictly in Spanish: 'Wara: Con el Crédito VIS compras tu departamento por solo $285 al mes en lugar de alquilar.', aspect ratio 9:16 --ar 9:16",
      image_prompt: "Cinematic vertical 9:16 portrait (1080x1920) of @personaje_1 and @personaje_2 in luxury penthouse in Santa Cruz with @logo and @tablet, 8k, aspect ratio 9:16 --ar 9:16",
      audio_dialogues: [
        { character: "Asesora Senior (Wara)", dialogue: "Con el Crédito VIS compras tu departamento por solo $285 al mes en lugar de alquilar." }
      ]
    },
    {
      shot_number: 2,
      shot_type: "Toma 2: Close-up Insert UI (00:10 - 00:20)",
      duration_seconds: 10,
      guion_es: "Plano detalle a la pantalla de la @tablet: Wara (@personaje_1) señala con el dedo la tasa del 5.5% regulada y la cuota fija mientras Rolo (@personaje_2) asiente con seguridad.",
      prompt_en: "Cinematic vertical 9:16 close-up insert (1080x1920) focusing on hands of @personaje_1 actively tapping the mortgage calculation on screen of @tablet held by @personaje_2, showing 5.5% rate and $285 monthly payment with glowing @logo, 24fps, Audio: Native clear neutral Latin American Spanish voiceover speaking strictly in Spanish: 'Rolo: La tasa del 5.5% está regulada por ley, lo que asegura tu cuota fija durante todo el crédito.', aspect ratio 9:16 --ar 9:16",
      image_prompt: "Cinematic vertical 9:16 macro close-up (1080x1920) of a sleek glass tablet displaying mortgage amortization chart with 5.5% VIS rate and @logo, 8k, aspect ratio 9:16 --ar 9:16",
      audio_dialogues: [
        { character: "Asesor Senior (Rolo)", dialogue: "La tasa del 5.5% está regulada por ley, lo que asegura tu cuota fija durante todo el crédito." }
      ]
    },
    {
      shot_number: 3,
      shot_type: "Toma 3: Panorámica Terraza & Cierre (00:20 - 00:30)",
      duration_seconds: 10,
      guion_es: "Corte continuo a la @terraza panorámica de Santa Cruz: Wara (@personaje_1) camina hacia el balcón con vista urbana e invita a comentar para recibir el simulador en WhatsApp con placa 3D de @logo.",
      prompt_en: "Cinematic vertical 9:16 smooth tracking shot (1080x1920) of @personaje_1 on the open panoramic @terraza in Santa Cruz with subtle city bokeh and 3D floating @logo plaque, confident welcoming gesture, 24fps, Audio: Native clear neutral Latin American Spanish voiceover speaking strictly in Spanish: 'Wara: Comenta la palabra CALCULAR y te paso el simulador bancario directo a tu WhatsApp.', aspect ratio 9:16 --ar 9:16",
      image_prompt: "Cinematic vertical 9:16 wide shot (1080x1920) of real estate professional @personaje_1 on luxury rooftop terrace in Santa Cruz with 3D golden @logo, 8k, aspect ratio 9:16 --ar 9:16",
      audio_dialogues: [
        { character: "Asesora Senior (Wara)", dialogue: "Comenta la palabra CALCULAR y te paso el simulador bancario directo a tu WhatsApp." }
      ]
    }
  ]);

  const [activeShotTab, setActiveShotTab] = useState<number>(0);
  const currentShot = shots[activeShotTab] || shots[0];

  // Estados de Interacción
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState<boolean>(false);

  // ── Manejadores de Elementos ──
  const toggleElement = (elementLabel: string) => {
    if (selectedElements.includes(elementLabel)) {
      setSelectedElements(selectedElements.filter((e) => e !== elementLabel));
    } else {
      setSelectedElements([...selectedElements, elementLabel]);
    }
  };

  const handleAddCustomElement = () => {
    const trimmed = customElementInput.trim();
    if (!trimmed) return;
    const formatted = `${trimmed} (@${trimmed.toLowerCase().replace(/\s+/g, "_")})`;
    if (!selectedElements.includes(formatted)) {
      setSelectedElements([...selectedElements, formatted]);
    }
    setCustomElementInput("");
  };

  const handleCharacterNameChange = (index: number, value: string) => {
    const updated = [...characterNames];
    updated[index] = value;
    setCharacterNames(updated);
  };

  // ── Generar Secuencia de Continuidad con IA ──
  const handleGenerateSequence = async () => {
    setIsGenerating(true);
    setErrorMessage(null);

    const activeTheme = isCustomThemeMode && customTheme.trim() ? customTheme.trim() : selectedTheme;
    const activeCharacters = characterNames.slice(0, characterCount);

    try {
      const response = await fetch("/api/ai/compile-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: ideaText,
          theme: activeTheme,
          characterCount,
          characters: activeCharacters,
          elements: selectedElements,
          city: targetCity,
          aspectRatio,
          forceSpanishAudio,
          mode: productionMode,
          shotCount: productionMode === "sequence" ? shotCount : 1,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error en el servidor (${response.status})`);
      }

      const data = await response.json();

      if (Array.isArray(data.shots) && data.shots.length > 0) {
        setShots(data.shots);
        setActiveShotTab(0);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al generar secuencia con IA";
      setErrorMessage(msg);
      console.error("[MarketingStudioView] Error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Actualizar Campo de Toma Actual ──
  const handleUpdateCurrentShotField = (field: keyof SequenceShot, value: any) => {
    const updated = [...shots];
    updated[activeShotTab] = {
      ...updated[activeShotTab],
      [field]: value,
    };
    setShots(updated);
  };

  // ── Actualizar Diálogo de Toma Actual ──
  const handleUpdateCurrentShotDialogue = (dIdx: number, field: keyof CharacterDialogue, value: string) => {
    const updated = [...shots];
    const shotDialogues = [...updated[activeShotTab].audio_dialogues];
    shotDialogues[dIdx] = { ...shotDialogues[dIdx], [field]: value };
    updated[activeShotTab] = {
      ...updated[activeShotTab],
      audio_dialogues: shotDialogues,
    };
    setShots(updated);
  };

  // ── Copiar al Portapapeles ──
  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // ── Descargar JSON de la Secuencia Completa para Flow ──
  const handleDownloadSequenceJson = () => {
    const activeTheme = isCustomThemeMode && customTheme.trim() ? customTheme.trim() : selectedTheme;
    const activeCharacters = characterNames.slice(0, characterCount);

    const exportData = {
      project_title: activeTheme,
      city: targetCity,
      aspect_ratio: aspectRatio,
      total_shots: shots.length,
      total_duration_seconds: shots.length * 10,
      characters: activeCharacters,
      elements: selectedElements,
      scenes: shots.map((s) => ({
        scene_number: s.shot_number,
        shot_type: s.shot_type,
        duration_seconds: 10,
        guion_es: s.guion_es,
        image_prompt: s.image_prompt,
        video_prompt: s.prompt_en,
        audio_dialogues: s.audio_dialogues,
      })),
    };

    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "script_flow_sequence.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  // JSON compilado para visualización
  const compiledJsonPreview = JSON.stringify(
    {
      theme: isCustomThemeMode ? customTheme : selectedTheme,
      city: targetCity,
      aspect_ratio: aspectRatio,
      total_duration_seconds: shots.length * 10,
      characters: characterNames.slice(0, characterCount),
      shots: shots,
    },
    null,
    2
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* ── HEADER PRINCIPAL ── */}
      <div className="bg-[#0B0D12] border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden shadow-2xl">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#D4AF37] to-[#8C6D1F] p-0.5 shadow-[0_0_20px_rgba(212,175,55,0.3)]">
                <div className="w-full h-full bg-[#0B0D12] rounded-[14px] flex items-center justify-center">
                  <Clapperboard className="w-6 h-6 text-[#D4AF37]" />
                </div>
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  Marketing Studio & Generador Flow
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#F3E5AB]">
                    Continuidad Cinemática
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Genera secuencias continuas de 2 a 4 tomas (10s c/u) con consistencia facial, diálogos en español y prompts de acción para Google Labs Flow.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="https://labs.google/flow"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-[#111622] hover:bg-[#1A2234] border border-slate-700 hover:border-[#D4AF37]/50 text-[#F3E5AB] font-bold rounded-xl text-xs flex items-center gap-2 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Abrir Google Labs Flow</span>
            </a>
          </div>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-300 text-xs">
          ⚠️ {errorMessage}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          PRIMER BLOQUE: CONCEPTO, PERSONAJES Y ELEMENTOS DE LA ESCENA
      ════════════════════════════════════════════════════════════════════ */}
      <div className="bg-[#111622] border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#D4AF37]/20 text-[#F3E5AB] font-black text-sm flex items-center justify-center">
              1
            </div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider">
              Primer Bloque: Concepto, Personajes y Elementos de la Escena
            </h2>
          </div>

          {/* Selector de Ratio, Ciudad y Audio */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setAspectRatio("9:16")}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  aspectRatio === "9:16" ? "bg-[#D4AF37]/20 text-[#F3E5AB] border border-[#D4AF37]/40" : "text-slate-400"
                }`}
              >
                <Smartphone className="w-3 h-3 inline mr-1" />
                9:16 Vertical
              </button>
              <button
                onClick={() => setAspectRatio("16:9")}
                className={`px-2.5 py-1 rounded-lg font-bold transition cursor-pointer ${
                  aspectRatio === "16:9" ? "bg-[#D4AF37]/20 text-[#F3E5AB] border border-[#D4AF37]/40" : "text-slate-400"
                }`}
              >
                <Monitor className="w-3 h-3 inline mr-1" />
                16:9 Web
              </button>
            </div>

            <select
              value={targetCity}
              onChange={(e) => setTargetCity(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 font-bold outline-none"
            >
              <option value="Santa Cruz">📍 Santa Cruz</option>
              <option value="La Paz">📍 La Paz</option>
              <option value="Cochabamba">📍 Cochabamba</option>
              <option value="Bolivia">📍 Bolivia (Nacional)</option>
            </select>

            <button
              onClick={() => setForceSpanishAudio(!forceSpanishAudio)}
              className={`px-2.5 py-1.5 rounded-xl font-bold border transition flex items-center gap-1 cursor-pointer ${
                forceSpanishAudio
                  ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                  : "bg-slate-950 border-slate-800 text-slate-400"
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{forceSpanishAudio ? "Audio ES: ON" : "Audio ES: OFF"}</span>
            </button>
          </div>
        </div>

        {/* 1. Descripción de la Idea */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-[#F3E5AB] flex items-center gap-1.5">
            <MessageSquare className="w-4 h-4 text-[#D4AF37]" />
            Describe tu Idea o Concepto de la Escena (Español libre):
          </label>
          <textarea
            value={ideaText}
            onChange={(e) => setIdeaText(e.target.value)}
            rows={3}
            placeholder="Escribe la idea libremente: ej. Dos asesores (Wara y Rolo) conversan en el ático sobre el Crédito VIS de $285/mes para jóvenes, mostrando la tablet y cerrando en el balcón..."
            className="w-full bg-slate-950 text-slate-100 p-3.5 rounded-xl text-xs outline-none border border-slate-800 focus:border-[#D4AF37] leading-relaxed"
          />
        </div>

        {/* 2. Tema y Modalidad de Producción (Secuencia vs Única) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300">Tema de la Escena:</label>
              <button
                onClick={() => setIsCustomThemeMode(!isCustomThemeMode)}
                className="text-[11px] font-bold text-[#D4AF37] hover:underline cursor-pointer"
              >
                {isCustomThemeMode ? "← Elegir tema predefinido" : "➕ Incluir nuevo tema..."}
              </button>
            </div>

            {isCustomThemeMode ? (
              <input
                type="text"
                value={customTheme}
                onChange={(e) => setCustomTheme(e.target.value)}
                placeholder="Escribe tu nuevo tema personalizado..."
                className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl text-xs outline-none border border-slate-800 focus:border-[#D4AF37]"
              />
            ) : (
              <select
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value)}
                className="w-full bg-slate-950 text-slate-100 p-2.5 rounded-xl text-xs outline-none border border-slate-800 focus:border-[#D4AF37]"
              >
                {PRESET_THEMES.map((theme) => (
                  <option key={theme} value={theme}>
                    {theme}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Modalidad de Producción: Tomas Conectadas de 10s */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
              Estructura de Continuidad (10s por Toma):
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { count: 2, label: "2 Tomas (20s)" },
                { count: 3, label: "3 Tomas (30s)" },
                { count: 4, label: "4 Tomas (40s)" }
              ].map((item) => (
                <button
                  key={item.count}
                  onClick={() => {
                    setProductionMode("sequence");
                    setShotCount(item.count);
                  }}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1 cursor-pointer ${
                    productionMode === "sequence" && shotCount === item.count
                      ? "bg-[#D4AF37] text-slate-950 border-[#D4AF37] shadow-sm"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                  }`}
                >
                  <Film className="w-3 h-3" />
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 3. Selección de Personajes (1 a 4) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
              Cantidad de Personajes en Escena:
            </label>
            <span className="text-[11px] text-slate-400">
              {characterCount} {characterCount === 1 ? "actor" : "actores"} participando en los diálogos
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((count) => (
              <button
                key={count}
                onClick={() => setCharacterCount(count)}
                className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1 cursor-pointer ${
                  characterCount === count
                    ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#F3E5AB] shadow-sm"
                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                <User className="w-3 h-3" />
                <span>{count} {count === 1 ? "Personaje" : "Personajes"}</span>
              </button>
            ))}
          </div>

          {/* Nombres / Roles de los Personajes */}
          <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-2">
            <span className="text-[10px] font-bold text-[#F3E5AB] uppercase tracking-wider block">
              Roles y Nombres (@personaje_1 ... @personaje_{characterCount}):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {Array.from({ length: characterCount }).map((_, idx) => (
                <div key={idx} className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    Personaje {idx + 1} (@personaje_{idx + 1}):
                  </label>
                  <input
                    type="text"
                    value={characterNames[idx] || `Personaje ${idx + 1}`}
                    onChange={(e) => handleCharacterNameChange(idx, e.target.value)}
                    placeholder={`ej. Asesora / Comprador ${idx + 1}`}
                    className="w-full bg-slate-900 text-slate-200 px-3 py-2 rounded-lg text-xs outline-none border border-slate-800 focus:border-[#D4AF37]"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Casilla de Elementos para Agregar */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-[#F3E5AB] flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-[#D4AF37]" />
            Elementos y Espacios para Incluir en el Prompt:
          </label>

          <div className="flex flex-wrap gap-2">
            {PRESET_ELEMENTS.map((elem) => {
              const isSelected = selectedElements.includes(elem.label);
              return (
                <button
                  key={elem.id}
                  onClick={() => toggleElement(elem.label)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer border ${
                    isSelected
                      ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#F3E5AB] shadow-sm"
                      : "bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {isSelected ? <Check className="w-3 h-3 text-[#D4AF37]" /> : <Plus className="w-3 h-3 text-slate-500" />}
                  <span>{elem.label}</span>
                </button>
              );
            })}
          </div>

          {/* Añadir Otro Elemento */}
          <div className="flex items-center gap-2 max-w-md pt-1">
            <input
              type="text"
              value={customElementInput}
              onChange={(e) => setCustomElementInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddCustomElement()}
              placeholder="Otro elemento (ej. Jacuzzi, Maqueta, Piscina...)"
              className="flex-1 bg-slate-950 text-slate-200 px-3 py-2 rounded-xl text-xs outline-none border border-slate-800 focus:border-[#D4AF37]"
            />
            <button
              onClick={handleAddCustomElement}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold rounded-xl text-xs cursor-pointer"
            >
              + Agregar
            </button>
          </div>
        </div>

        {/* 5. Botón Principal de Generación */}
        <div className="pt-2 border-t border-slate-800">
          <button
            onClick={handleGenerateSequence}
            disabled={isGenerating}
            className="w-full py-3.5 bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#B89628] hover:brightness-110 disabled:opacity-50 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Compilando Secuencia Cinemática de {shotCount} Tomas (10s c/u)...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                <span>✨ Generar Secuencia Cinemática con IA ({shotCount} Tomas / 10s)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SEGUNDO BLOQUE: GUIONES BILINGÜES, DIÁLOGOS Y JSON GENERADO
      ════════════════════════════════════════════════════════════════════ */}
      <div className="bg-[#111622] border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 font-black text-sm flex items-center justify-center">
              2
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                Segundo Bloque: Secuencia de {shots.length} Tomas Continuas ({shots.length * 10} Segundos)
              </h2>
              <p className="text-[11px] text-slate-400">
                Cada toma está calculada para exactamente 10 segundos con continuidad 100% de vestimenta y set.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                isEditing
                  ? "bg-[#D4AF37] text-slate-950 border-[#D4AF37]"
                  : "bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700"
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? "Guardar Cambios" : "Editar Textos"}</span>
            </button>

            <button
              onClick={handleGenerateSequence}
              disabled={isGenerating}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Rehacer Secuencia</span>
            </button>
          </div>
        </div>

        {/* Pestañas de Tomas Continuas (Toma 1, Toma 2, Toma 3...) */}
        <div className="flex flex-wrap gap-2">
          {shots.map((s, sIdx) => {
            const isActive = activeShotTab === sIdx;
            return (
              <button
                key={s.shot_number}
                onClick={() => setActiveShotTab(sIdx)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
                  isActive
                    ? "bg-[#D4AF37] text-slate-950 border-[#D4AF37] shadow-md font-black"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>{s.shot_type || `Toma ${s.shot_number} (10s)`}</span>
              </button>
            );
          })}
        </div>

        {/* 1. Fila de Guiones Lado a Lado para la Toma Activa */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Casilla Izquierda: Prompt en Inglés Completo (Flow) */}
          <div className="space-y-2 flex flex-col justify-between bg-slate-950/80 p-4 rounded-xl border border-slate-800">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-black text-emerald-400 uppercase flex items-center gap-1.5">
                  <Film className="w-4 h-4" />
                  Prompt de Video Flow ({currentShot.shot_type})
                </span>
                <button
                  onClick={() => handleCopy(currentShot.prompt_en, `copy_shot_en_${activeShotTab}`)}
                  className="px-2.5 py-1 bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#F3E5AB] font-bold rounded-lg text-xs border border-[#D4AF37]/40 flex items-center gap-1 cursor-pointer transition"
                >
                  {copiedKey === `copy_shot_en_${activeShotTab}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === `copy_shot_en_${activeShotTab}` ? "¡Copiado!" : "Copiar Prompt Flow"}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mb-2">
                Prompt cinemático en inglés con tokens <code className="text-[#D4AF37]">@</code>, 24fps y audio de estos 10 segundos.
              </p>
            </div>

            {isEditing ? (
              <textarea
                value={currentShot.prompt_en}
                onChange={(e) => handleUpdateCurrentShotField("prompt_en", e.target.value)}
                rows={7}
                className="w-full bg-[#0B0D12] text-slate-200 p-3 rounded-xl text-xs font-mono outline-none border border-slate-700 focus:border-[#D4AF37] leading-relaxed min-h-[180px]"
              />
            ) : (
              <div className="p-3.5 bg-[#0B0D12] rounded-xl border border-slate-900 text-xs font-mono text-slate-300 leading-relaxed min-h-[180px] overflow-y-auto">
                {currentShot.prompt_en}
              </div>
            )}

            {/* Start Frame / Imagen Fija */}
            <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">Start Frame / Imagen Fija:</span>
              <button
                onClick={() => handleCopy(currentShot.image_prompt, `copy_shot_img_${activeShotTab}`)}
                className="text-[10px] text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === `copy_shot_img_${activeShotTab}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>Copiar Imagen 8K</span>
              </button>
            </div>
          </div>

          {/* Casilla Derecha: Guión en Español Completo */}
          <div className="space-y-2 flex flex-col justify-between bg-slate-950/80 p-4 rounded-xl border border-slate-800">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-black text-[#F3E5AB] uppercase flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-[#D4AF37]" />
                  Guión de Dirección en Español (10 Segundos)
                </span>
                <button
                  onClick={() => handleCopy(currentShot.guion_es, `copy_shot_es_${activeShotTab}`)}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === `copy_shot_es_${activeShotTab}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === `copy_shot_es_${activeShotTab}` ? "¡Copiado!" : "Copiar Guión"}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mb-2">
                Instrucciones escénicas, movimiento de cámara y continuidad visual.
              </p>
            </div>

            {isEditing ? (
              <textarea
                value={currentShot.guion_es}
                onChange={(e) => handleUpdateCurrentShotField("guion_es", e.target.value)}
                rows={7}
                className="w-full bg-[#0B0D12] text-slate-200 p-3 rounded-xl text-xs outline-none border border-slate-700 focus:border-[#D4AF37] leading-relaxed min-h-[180px]"
              />
            ) : (
              <div className="p-3.5 bg-[#0B0D12] rounded-xl border border-slate-900 text-xs text-slate-300 leading-relaxed min-h-[180px] overflow-y-auto">
                {currentShot.guion_es}
              </div>
            )}

            <div className="pt-2 border-t border-slate-900 text-[11px] text-slate-500">
              ⏱️ Duración exacta: <b>10.0 segundos</b> (~25 palabras en español).
            </div>
          </div>
        </div>

        {/* 2. Casilla de Texto de Audio / Diálogos para estos 10 Segundos */}
        <div className="bg-slate-950/90 p-5 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black text-[#F3E5AB] uppercase flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-[#D4AF37]" />
                Diálogos y Locución para esta Toma ({currentShot.shot_type})
              </h3>
              <p className="text-[11px] text-slate-400">
                Texto en español que se pronuncia durante estos 10 segundos.
              </p>
            </div>
            <button
              onClick={() => {
                const combined = currentShot.audio_dialogues.map((d) => `${d.character}: "${d.dialogue}"`).join("\n");
                handleCopy(combined, `copy_dialogues_${activeShotTab}`);
              }}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              {copiedKey === `copy_dialogues_${activeShotTab}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>Copiar Diálogos</span>
            </button>
          </div>

          <div className="space-y-2.5">
            {currentShot.audio_dialogues.map((item, dIdx) => (
              <div key={dIdx} className="bg-[#0B0D12] p-3.5 rounded-xl border border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-[#D4AF37]" />
                    {isEditing ? (
                      <input
                        type="text"
                        value={item.character}
                        onChange={(e) => handleUpdateCurrentShotDialogue(dIdx, "character", e.target.value)}
                        className="bg-slate-900 text-white font-bold text-xs px-2 py-0.5 rounded border border-slate-700 outline-none"
                      />
                    ) : (
                      <span className="text-xs font-bold text-[#F3E5AB]">{item.character}</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleCopy(item.dialogue, `copy_d_${activeShotTab}_${dIdx}`)}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === `copy_d_${activeShotTab}_${dIdx}` ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                    <span>Copiar</span>
                  </button>
                </div>

                {isEditing ? (
                  <textarea
                    value={item.dialogue}
                    onChange={(e) => handleUpdateCurrentShotDialogue(dIdx, "dialogue", e.target.value)}
                    rows={2}
                    className="w-full bg-slate-900 text-slate-200 p-2 rounded-lg text-xs italic outline-none border border-slate-700 focus:border-[#D4AF37]"
                  />
                ) : (
                  <p className="text-xs text-slate-200 italic leading-relaxed">
                    "{item.dialogue}"
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 3. Casilla de Código JSON de Toda la Secuencia Conectada */}
        <div className="bg-slate-950/90 p-5 rounded-xl border border-slate-800 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-purple-400" />
              <div>
                <h3 className="text-xs font-black text-white uppercase">
                  JSON de la Secuencia Completa ({shots.length} Escenas para Batch en Flow)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Exporta este archivo para renderizar automáticamente todas las tomas en Google Labs Flow.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(compiledJsonPreview, "copy_full_json")}
                className="px-3 py-1.5 bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#F3E5AB] font-bold rounded-lg text-xs border border-[#D4AF37]/40 flex items-center gap-1.5 cursor-pointer transition"
              >
                {copiedKey === "copy_full_json" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === "copy_full_json" ? "¡JSON Copiado!" : "Copiar JSON"}</span>
              </button>

              <button
                onClick={handleDownloadSequenceJson}
                className="px-3.5 py-1.5 bg-gradient-to-r from-[#D4AF37] to-[#B89628] hover:brightness-110 text-slate-950 font-black rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition"
              >
                {downloadSuccess ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                <span>{downloadSuccess ? "¡Descargado!" : "Descargar script_flow_sequence.json"}</span>
              </button>
            </div>
          </div>

          <textarea
            readOnly
            value={compiledJsonPreview}
            rows={8}
            className="w-full bg-[#0B0D12] text-purple-300 p-4 rounded-xl text-xs font-mono outline-none border border-slate-800 leading-relaxed"
          />
        </div>
      </div>
    </div>
  );
};
