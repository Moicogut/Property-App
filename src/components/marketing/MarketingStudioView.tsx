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
  Clapperboard,
  FolderDown,
  AlertCircle
} from "lucide-react";
import type { AppUser, Lead } from "@/src/types/property";

interface MarketingStudioViewProps {
  currentUser: AppUser;
  leads?: Lead[];
}

export interface ScriptSceneItem {
  scene_number: number;
  image_prompt: string;
  video_prompt: string;
  narration: string;
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

  // Cantidad de Escenas de 10s Continuas (2, 3 o 4)
  const [shotCount, setShotCount] = useState<number>(3);

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

  // ── BLOQUE 2: Estructura Oficial script.json ──
  const [scenes, setScenes] = useState<ScriptSceneItem[]>([
    {
      scene_number: 1,
      image_prompt: "Cinematic vertical 9:16 portrait (1080x1920) of @personaje_1 in burgundy blouse and @personaje_2 in navy suit standing in modern luxury penthouse in Santa Cruz with @logo and @tablet, 8k, aspect ratio 9:16 --ar 9:16",
      video_prompt: "Cinematic vertical 9:16 medium two-shot (1080x1920), camera tracks smoothly towards @personaje_1 conversing naturally with @personaje_2 holding glass @tablet with official @logo inside @atico in Santa Cruz, soft 5600K key light, 3200K rim lighting, 24fps, Audio: Native clear neutral Latin American Spanish voiceover speaking strictly in Spanish: 'Con el Crédito VIS compras tu departamento por solo 285 dólares al mes en lugar de alquilar.', aspect ratio 9:16 --ar 9:16",
      narration: "Con el Crédito VIS compras tu departamento por solo 285 dólares al mes en lugar de alquilar."
    },
    {
      scene_number: 2,
      image_prompt: "Cinematic vertical 9:16 macro close-up (1080x1920) of a sleek glass tablet displaying mortgage amortization chart with 5.5% VIS rate and @logo, 8k, aspect ratio 9:16 --ar 9:16",
      video_prompt: "Cinematic vertical 9:16 close-up insert (1080x1920), camera focuses on hands of @personaje_1 actively tapping the mortgage calculation on screen of @tablet held by @personaje_2, showing 5.5% rate and $285 monthly payment with glowing @logo, 24fps, Audio: Native clear neutral Latin American Spanish voiceover speaking strictly in Spanish: 'La tasa del 5.5% está regulada por ley, lo que asegura tu cuota fija durante todo el crédito.', aspect ratio 9:16 --ar 9:16",
      narration: "La tasa del 5.5% está regulada por ley, lo que asegura tu cuota fija durante todo el crédito."
    },
    {
      scene_number: 3,
      image_prompt: "Cinematic vertical 9:16 wide shot (1080x1920) of real estate professional @personaje_1 on luxury rooftop terrace in Santa Cruz with 3D golden @logo, 8k, aspect ratio 9:16 --ar 9:16",
      video_prompt: "Cinematic vertical 9:16 smooth tracking shot (1080x1920) of @personaje_1 on the open panoramic @terraza in Santa Cruz with subtle city bokeh and 3D floating @logo plaque, confident welcoming gesture, 24fps, Audio: Native clear neutral Latin American Spanish voiceover speaking strictly in Spanish: 'Comenta la palabra CALCULAR y te paso el simulador bancario directo a tu WhatsApp.', aspect ratio 9:16 --ar 9:16",
      narration: "Comenta la palabra CALCULAR y te paso el simulador bancario directo a tu WhatsApp."
    }
  ]);

  const [activeSceneTab, setActiveSceneTab] = useState<number>(0);
  const currentScene = scenes[activeSceneTab] || scenes[0];

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

  // ── Generar script.json con IA ──
  const handleGenerateScriptJson = async () => {
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
          shotCount,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error en el servidor de IA (${response.status})`);
      }

      const data = await response.json();

      if (Array.isArray(data.scenes) && data.scenes.length > 0) {
        setScenes(data.scenes);
        setActiveSceneTab(0);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al generar script.json con IA";
      setErrorMessage(msg);
      console.error("[MarketingStudioView] Error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Actualizar Campo de Escena Actual ──
  const handleUpdateCurrentSceneField = (field: keyof ScriptSceneItem, value: any) => {
    const updated = [...scenes];
    updated[activeSceneTab] = {
      ...updated[activeSceneTab],
      [field]: value,
    };
    setScenes(updated);
  };

  // ── Copiar al Portapapeles ──
  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // ── Descargar STRICTAMENTE como script.json ──
  const handleDownloadStrictScriptJson = () => {
    const jsonPayload = {
      scenes: scenes.map((s, idx) => ({
        scene_number: idx + 1,
        image_prompt: s.image_prompt,
        video_prompt: s.video_prompt,
        narration: s.narration,
      })),
    };

    const jsonStr = JSON.stringify(jsonPayload, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    // NOMBRE ESTRICTO EXIGIDO POR LA EXTENSIÓN: script.json
    a.download = "script.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3500);
  };

  // Código JSON oficial para el textarea
  const officialJsonOutput = JSON.stringify(
    {
      scenes: scenes.map((s, idx) => ({
        scene_number: idx + 1,
        image_prompt: s.image_prompt,
        video_prompt: s.video_prompt,
        narration: s.narration,
      })),
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
                  Marketing Studio — Generador Oficial script.json
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#F3E5AB]">
                    Flow & Vibes AI
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Genera el archivo <code className="text-[#D4AF37] font-bold">script.json</code> con la estructura exacta de escenas, prompts en inglés y locución en español para automatizar con la extensión.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadStrictScriptJson}
              className="px-4 py-2.5 bg-gradient-to-r from-[#D4AF37] to-[#B89628] hover:brightness-110 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg transition cursor-pointer"
            >
              {downloadSuccess ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
              <span>{downloadSuccess ? "¡script.json Descargado!" : "Descargar script.json"}</span>
            </button>
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

        {/* 2. Tema y Cantidad de Escenas de 10s */}
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

          {/* Cantidad de Escenas Continuas de 10s */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#D4AF37]" />
              Secuencia de Continuidad (10s por Escena):
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { count: 2, label: "2 Escenas (20s)" },
                { count: 3, label: "3 Escenas (30s)" },
                { count: 4, label: "4 Escenas (40s)" }
              ].map((item) => (
                <button
                  key={item.count}
                  onClick={() => setShotCount(item.count)}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1 cursor-pointer ${
                    shotCount === item.count
                      ? "bg-[#D4AF37] text-slate-950 border-[#D4AF37] shadow-sm font-black"
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
                    ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#F3E5AB] shadow-sm font-bold"
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
            onClick={handleGenerateScriptJson}
            disabled={isGenerating}
            className="w-full py-3.5 bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#B89628] hover:brightness-110 disabled:opacity-50 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generando script.json para Flow con IA ({shotCount} Escenas)...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                <span>✨ Generar script.json con IA ({shotCount} Escenas de 10s)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SEGUNDO BLOQUE: GUIONES BILINGÜES, LOCUCIÓN Y JSON OFICIAL
      ════════════════════════════════════════════════════════════════════ */}
      <div className="bg-[#111622] border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 font-black text-sm flex items-center justify-center">
              2
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-wider">
                Segundo Bloque: Escenas del script.json ({scenes.length} Escenas / {scenes.length * 10}s Totales)
              </h2>
              <p className="text-[11px] text-slate-400">
                Cada escena está formateada en una sola línea de texto plano sin saltos de línea para compatibilidad total con la extensión.
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
              onClick={handleGenerateScriptJson}
              disabled={isGenerating}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Rehacer con IA</span>
            </button>
          </div>
        </div>

        {/* Selector de Pestaña de Escena */}
        <div className="flex flex-wrap gap-2">
          {scenes.map((s, sIdx) => {
            const isActive = activeSceneTab === sIdx;
            return (
              <button
                key={s.scene_number}
                onClick={() => setActiveSceneTab(sIdx)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer border ${
                  isActive
                    ? "bg-[#D4AF37] text-slate-950 border-[#D4AF37] shadow-md font-black"
                    : "bg-slate-950 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-900"
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>Escena {s.scene_number} (10s)</span>
              </button>
            );
          })}
        </div>

        {/* 1. Fila de Prompts y Locución para la Escena Activa */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Casilla Izquierda: Video Prompt para Flow */}
          <div className="space-y-2 flex flex-col justify-between bg-slate-950/80 p-4 rounded-xl border border-slate-800">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-black text-emerald-400 uppercase flex items-center gap-1.5">
                  <Film className="w-4 h-4" />
                  video_prompt (Escena {currentScene.scene_number})
                </span>
                <button
                  onClick={() => handleCopy(currentScene.video_prompt, `copy_vid_${activeSceneTab}`)}
                  className="px-2.5 py-1 bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#F3E5AB] font-bold rounded-lg text-xs border border-[#D4AF37]/40 flex items-center gap-1 cursor-pointer transition"
                >
                  {copiedKey === `copy_vid_${activeSceneTab}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === `copy_vid_${activeSceneTab}` ? "¡Copiado!" : "Copiar video_prompt"}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mb-2">
                Prompt cinemático en inglés con tokens <code className="text-[#D4AF37]">@</code> y directiva de audio en español.
              </p>
            </div>

            {isEditing ? (
              <textarea
                value={currentScene.video_prompt}
                onChange={(e) => handleUpdateCurrentSceneField("video_prompt", e.target.value)}
                rows={6}
                className="w-full bg-[#0B0D12] text-slate-200 p-3 rounded-xl text-xs font-mono outline-none border border-slate-700 focus:border-[#D4AF37] leading-relaxed min-h-[160px]"
              />
            ) : (
              <div className="p-3.5 bg-[#0B0D12] rounded-xl border border-slate-900 text-xs font-mono text-slate-300 leading-relaxed min-h-[160px] overflow-y-auto">
                {currentScene.video_prompt}
              </div>
            )}

            {/* Image Prompt */}
            <div className="pt-2 border-t border-slate-900 flex items-center justify-between text-[11px]">
              <span className="text-slate-400">image_prompt (Start frame 8K):</span>
              <button
                onClick={() => handleCopy(currentScene.image_prompt, `copy_img_${activeSceneTab}`)}
                className="text-[10px] text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
              >
                {copiedKey === `copy_img_${activeSceneTab}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>Copiar image_prompt</span>
              </button>
            </div>
          </div>

          {/* Casilla Derecha: Narration (Locución en Español) */}
          <div className="space-y-2 flex flex-col justify-between bg-slate-950/80 p-4 rounded-xl border border-slate-800">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-black text-[#F3E5AB] uppercase flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-[#D4AF37]" />
                  narration (Locución en Español para esta Escena)
                </span>
                <button
                  onClick={() => handleCopy(currentScene.narration, `copy_narr_${activeSceneTab}`)}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === `copy_narr_${activeSceneTab}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === `copy_narr_${activeSceneTab}` ? "¡Copiado!" : "Copiar narration"}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mb-2">
                Texto en español que se pronuncia durante estos 10 segundos (~20-25 palabras).
              </p>
            </div>

            {isEditing ? (
              <textarea
                value={currentScene.narration}
                onChange={(e) => handleUpdateCurrentSceneField("narration", e.target.value)}
                rows={6}
                className="w-full bg-[#0B0D12] text-slate-200 p-3 rounded-xl text-xs italic outline-none border border-slate-700 focus:border-[#D4AF37] leading-relaxed min-h-[160px]"
              />
            ) : (
              <div className="p-3.5 bg-[#0B0D12] rounded-xl border border-slate-900 text-xs italic text-slate-300 leading-relaxed min-h-[160px] overflow-y-auto">
                "{currentScene.narration}"
              </div>
            )}

            <div className="pt-2 border-t border-slate-900 text-[11px] text-slate-500">
              ⏱️ Duración exacta: <b>10.0 segundos</b> de locución sincronizada.
            </div>
          </div>
        </div>

        {/* 2. Casilla de Código script.json Oficial y Guía para la Extensión */}
        <div className="bg-slate-950/90 p-5 rounded-xl border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="text-xs font-black text-white uppercase flex items-center gap-2">
                  Estructura Oficial: <code className="text-[#D4AF37]">script.json</code> ({scenes.length} Escenas)
                </h3>
                <p className="text-[11px] text-slate-400">
                  Formato nativo listo para colocar en tu carpeta vacía (ej. <code className="text-slate-300">Descargas/flow/script.json</code>) y leer con la extensión en Flow.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(officialJsonOutput, "copy_official_json")}
                className="px-3 py-1.5 bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#F3E5AB] font-bold rounded-lg text-xs border border-[#D4AF37]/40 flex items-center gap-1.5 cursor-pointer transition"
              >
                {copiedKey === "copy_official_json" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === "copy_official_json" ? "¡JSON Copiado!" : "Copiar JSON"}</span>
              </button>

              <button
                onClick={handleDownloadStrictScriptJson}
                className="px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-[#B89628] hover:brightness-110 text-slate-950 font-black rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition"
              >
                {downloadSuccess ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                <span>{downloadSuccess ? "¡Descargado como script.json!" : "Descargar script.json"}</span>
              </button>
            </div>
          </div>

          <textarea
            readOnly
            value={officialJsonOutput}
            rows={9}
            className="w-full bg-[#0B0D12] text-emerald-300 p-4 rounded-xl text-xs font-mono outline-none border border-slate-800 leading-relaxed"
          />

          {/* Guía Rápida de Uso en 3 Pasos */}
          <div className="bg-[#0B0D12] p-4 rounded-xl border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-400">
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-md bg-[#D4AF37]/20 text-[#F3E5AB] font-black text-xs flex items-center justify-center shrink-0">1</span>
              <p>Descarga <code className="text-[#D4AF37]">script.json</code> en tu carpeta (ej. <code className="text-slate-300">Descargas/flow/</code>).</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-md bg-emerald-500/20 text-emerald-400 font-black text-xs flex items-center justify-center shrink-0">2</span>
              <p>En la extensión de Chrome, selecciona esa carpeta en la pestaña <b>Proyecto</b>.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-md bg-blue-500/20 text-blue-400 font-black text-xs flex items-center justify-center shrink-0">3</span>
              <p>Presiona <b>Imágenes</b> y luego <b>Videos</b>. Flow creará las carpetas y renderizará el lote.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
