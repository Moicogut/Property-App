import React, { useState } from "react";
import {
  Sparkles,
  Download,
  Copy,
  Check,
  Film,
  MessageSquare,
  Plus,
  Trash2,
  RotateCcw,
  Volume2,
  User,
  Users,
  Layers,
  Loader2,
  Wand2,
  Edit3,
  CheckCircle2,
  Tag,
  Code2,
  Smartphone,
  Monitor
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
  // ── BLOQUE 1: Configuración de la Idea y Elementos ──
  const [ideaText, setIdeaText] = useState<string>(
    "Explicar que con crédito de vivienda social VIS al 5.5% regulado, los jóvenes compran su primer departamento de $48,000 en Santa Cruz pagando $285 al mes en lugar de alquilar."
  );
  const [selectedTheme, setSelectedTheme] = useState<string>("Crédito VIS & Cuotas ($285/mes)");
  const [customTheme, setCustomTheme] = useState<string>("");
  const [isCustomThemeMode, setIsCustomThemeMode] = useState<boolean>(false);

  // Personajes (1 a 4)
  const [characterCount, setCharacterCount] = useState<number>(1);
  const [characterNames, setCharacterNames] = useState<string[]>([
    "Asesora Senior (Wara)",
    "Cliente Comprador",
    "Segundo Asesor",
    "Inversionista"
  ]);

  // Elementos activos
  const [selectedElements, setSelectedElements] = useState<string[]>([
    "Logo (@logo)",
    "Tablet con Cotizador (@tablet)",
    "Ático / Penthouse (@atico)"
  ]);
  const [customElementInput, setCustomElementInput] = useState<string>("");

  // Opciones de Formato
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "16:9">("9:16");
  const [targetCity, setTargetCity] = useState<string>("Santa Cruz");
  const [forceSpanishAudio, setForceSpanishAudio] = useState<boolean>(true);

  // ── BLOQUE 2: Resultados y Edición Bilingüe ──
  const [promptEn, setPromptEn] = useState<string>(
    "Cinematic vertical 9:16 format (1080x1920) of @personaje_1 presenting mortgage calculations on a glass @tablet with official @logo inside @atico in Santa Cruz, smooth 24fps movement, 5600K key light with subtle 3200K rim lighting, Audio: Native clear neutral Latin American Spanish voiceover speaking strictly in Spanish: 'Si sigues creyendo que necesitas cincuenta mil dólares para comprar tu primer departamento en Santa Cruz, estás perdiendo dinero. Con el Crédito VIS la tasa es del 5.5% por ley. Por un departamento de 48,000 dólares pagas 285 dólares al mes. Comenta CALCULAR.', aspect ratio 9:16 --ar 9:16"
  );
  const [guionEs, setGuionEs] = useState<string>(
    "La asesora @personaje_1 sostiene una @tablet mostrando la cuota mensual de $285/mes regulada bajo Crédito VIS dentro de un @atico con vista a Santa Cruz y el @logo de Property OS iluminado."
  );
  const [imagePrompt, setImagePrompt] = useState<string>(
    "Cinematic vertical 9:16 portrait (1080x1920) of @personaje_1 holding @tablet with @logo set in @atico, 8k, aspect ratio 9:16 --ar 9:16"
  );
  const [dialogues, setDialogues] = useState<CharacterDialogue[]>([
    {
      character: "Personaje 1 (Asesora)",
      dialogue: "Si sigues creyendo que necesitas cincuenta mil dólares para comprar tu primer departamento en Santa Cruz, estás perdiendo dinero. Con el Crédito VIS pagas 285 dólares al mes. Comenta CALCULAR."
    }
  ]);
  const [generatedJson, setGeneratedJson] = useState<string>("");

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

  // ── Generar Guión y Prompts con IA ──
  const handleGenerateScript = async () => {
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
        }),
      });

      if (!response.ok) {
        throw new Error(`Error en el servidor (${response.status})`);
      }

      const data = await response.json();

      setPromptEn(data.prompt_en || "");
      setGuionEs(data.guion_es || "");
      setImagePrompt(data.image_prompt || "");
      if (Array.isArray(data.audio_dialogues)) {
        setDialogues(data.audio_dialogues);
      } else {
        setDialogues([
          {
            character: activeCharacters[0] || "Personaje 1",
            dialogue: data.guion_es || "Texto de locución..."
          }
        ]);
      }

      // Auto-generar JSON
      const jsonStructure = {
        scene_number: 1,
        theme: activeTheme,
        city: targetCity,
        aspect_ratio: aspectRatio,
        characters: activeCharacters,
        elements: selectedElements,
        guion_es: data.guion_es || "",
        prompt_en: data.prompt_en || "",
        image_prompt: data.image_prompt || "",
        audio_dialogues: data.audio_dialogues || [],
      };
      setGeneratedJson(JSON.stringify(jsonStructure, null, 2));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al generar guión con IA";
      setErrorMessage(msg);
      console.error("[MarketingStudioView] Error:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  // ── Generar / Actualizar JSON Manualmente ──
  const handleBuildJson = () => {
    const activeTheme = isCustomThemeMode && customTheme.trim() ? customTheme.trim() : selectedTheme;
    const activeCharacters = characterNames.slice(0, characterCount);

    const jsonStructure = {
      scene_number: 1,
      theme: activeTheme,
      city: targetCity,
      aspect_ratio: aspectRatio,
      characters: activeCharacters,
      elements: selectedElements,
      guion_es: guionEs,
      prompt_en: promptEn,
      image_prompt: imagePrompt,
      audio_dialogues: dialogues,
    };
    setGeneratedJson(JSON.stringify(jsonStructure, null, 2));
  };

  // ── Copiar al Portapapeles ──
  const handleCopy = (text: string, key: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  // ── Descargar JSON ──
  const handleDownloadJson = () => {
    if (!generatedJson) {
      handleBuildJson();
    }
    const contentToDownload = generatedJson || JSON.stringify({ prompt_en: promptEn, guion_es: guionEs, dialogues }, null, 2);
    const blob = new Blob([contentToDownload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "scene_flow.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  // Actualizar diálogo individual
  const handleUpdateDialogue = (index: number, field: keyof CharacterDialogue, value: string) => {
    const updated = [...dialogues];
    updated[index] = { ...updated[index], [field]: value };
    setDialogues(updated);
  };

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
                  <Film className="w-6 h-6 text-[#D4AF37]" />
                </div>
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  Marketing Studio — Generador de Guiones & Prompts Flow
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#F3E5AB]">
                    IA Multimodal
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Escribe tu idea en español, selecciona personajes y elementos, y obtén los prompts y JSON listos para Google Labs Flow.
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
          PRIMER BLOQUE: DESCRIPCIÓN DE IDEA, TEMA, PERSONAJES Y ELEMENTOS
      ════════════════════════════════════════════════════════════════════ */}
      <div className="bg-[#111622] border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-[#D4AF37]/20 text-[#F3E5AB] font-black text-sm flex items-center justify-center">
              1
            </div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider">
              Primer Bloque: Concepto, Personajes y Elementos de la Escena
            </h2>
          </div>

          {/* Selector de Ratio y Ciudad */}
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
            placeholder="Escribe la idea libremente: ej. La asesora muestra en su tablet cómo con $285 al mes compras un departamento de $48,000 en Santa Cruz con Crédito VIS, dejando de pagar alquiler..."
            className="w-full bg-slate-950 text-slate-100 p-3.5 rounded-xl text-xs outline-none border border-slate-800 focus:border-[#D4AF37] leading-relaxed"
          />
        </div>

        {/* 2. Tema Desplegable o Nuevo */}
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
                placeholder="Escribe el nombre de tu nuevo tema personalizado..."
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

          {/* 3. Selección de Personajes (1 a 4) */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#D4AF37]" />
              Cantidad de Personajes en Escena:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((count) => (
                <button
                  key={count}
                  onClick={() => setCharacterCount(count)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1 cursor-pointer ${
                    characterCount === count
                      ? "bg-[#D4AF37] text-slate-950 border-[#D4AF37] shadow-sm"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                  }`}
                >
                  <User className="w-3 h-3" />
                  <span>{count} {count === 1 ? "Personaje" : "Personajes"}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Nombres / Roles de los Personajes Seleccionados */}
        <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800 space-y-3">
          <span className="text-[11px] font-bold text-[#F3E5AB] uppercase tracking-wider block">
            Especificación de Personajes (@personaje_1 ... @personaje_{characterCount}):
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

          {/* Añadir Otro Elemento Personalizado */}
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

        {/* 5. Botón de Generar Guión */}
        <div className="pt-2 border-t border-slate-800">
          <button
            onClick={handleGenerateScript}
            disabled={isGenerating}
            className="w-full py-3.5 bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#B89628] hover:brightness-110 disabled:opacity-50 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generando Guión y Prompts Multimodales con IA...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-5 h-5" />
                <span>✨ Generar Guión y Prompts con IA</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SEGUNDO BLOQUE: GUIONES BILINGÜES, DIÁLOGOS Y JSON GENERADO
      ════════════════════════════════════════════════════════════════════ */}
      <div className="bg-[#111622] border border-slate-800 rounded-2xl p-6 space-y-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-emerald-500/20 text-emerald-400 font-black text-sm flex items-center justify-center">
              2
            </div>
            <h2 className="text-sm font-black text-white uppercase tracking-wider">
              Segundo Bloque: Guiones, Diálogos de Audio y Código JSON
            </h2>
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
              onClick={handleGenerateScript}
              disabled={isGenerating}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Rehacer con IA</span>
            </button>

            <button
              onClick={handleBuildJson}
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm"
            >
              <Code2 className="w-3.5 h-3.5" />
              <span>Generar JSON</span>
            </button>
          </div>
        </div>

        {/* 1. Casilla de Guión en Inglés (Prompt de Video Flow) vs Guión en Español */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Casilla Izquierda: Guión en Inglés Completo */}
          <div className="space-y-2 flex flex-col justify-between bg-slate-950/80 p-4 rounded-xl border border-slate-800">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-black text-emerald-400 uppercase flex items-center gap-1.5">
                  <Film className="w-4 h-4" />
                  Guión / Prompt en Inglés Completo (Flow)
                </span>
                <button
                  onClick={() => handleCopy(promptEn, "copy_prompt_en")}
                  className="px-2.5 py-1 bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#F3E5AB] font-bold rounded-lg text-xs border border-[#D4AF37]/40 flex items-center gap-1 cursor-pointer transition"
                >
                  {copiedKey === "copy_prompt_en" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === "copy_prompt_en" ? "¡Copiado!" : "Copiar Prompt Flow"}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mb-2">
                Prompt cinemático en inglés con tokens <code className="text-[#D4AF37]">@</code> y directiva de audio en español.
              </p>
            </div>

            {isEditing ? (
              <textarea
                value={promptEn}
                onChange={(e) => setPromptEn(e.target.value)}
                rows={7}
                className="w-full bg-[#0B0D12] text-slate-200 p-3 rounded-xl text-xs font-mono outline-none border border-slate-700 focus:border-[#D4AF37] leading-relaxed min-h-[180px]"
              />
            ) : (
              <div className="p-3.5 bg-[#0B0D12] rounded-xl border border-slate-900 text-xs font-mono text-slate-300 leading-relaxed min-h-[180px] overflow-y-auto">
                {promptEn}
              </div>
            )}
          </div>

          {/* Casilla Derecha: Guión en Español Completo */}
          <div className="space-y-2 flex flex-col justify-between bg-slate-950/80 p-4 rounded-xl border border-slate-800">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-black text-[#F3E5AB] uppercase flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-[#D4AF37]" />
                  Guión en Español Completo
                </span>
                <button
                  onClick={() => handleCopy(guionEs, "copy_guion_es")}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                >
                  {copiedKey === "copy_guion_es" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === "copy_guion_es" ? "¡Copiado!" : "Copiar Guión"}</span>
                </button>
              </div>
              <p className="text-[11px] text-slate-400 mb-2">
                Descripción cinematográfica y dirección de escena en español.
              </p>
            </div>

            {isEditing ? (
              <textarea
                value={guionEs}
                onChange={(e) => setGuionEs(e.target.value)}
                rows={7}
                className="w-full bg-[#0B0D12] text-slate-200 p-3 rounded-xl text-xs outline-none border border-slate-700 focus:border-[#D4AF37] leading-relaxed min-h-[180px]"
              />
            ) : (
              <div className="p-3.5 bg-[#0B0D12] rounded-xl border border-slate-900 text-xs text-slate-300 leading-relaxed min-h-[180px] overflow-y-auto">
                {guionEs}
              </div>
            )}
          </div>
        </div>

        {/* 2. Casilla del Texto de Audio o Conversación por Cada Personaje */}
        <div className="bg-slate-950/90 p-5 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-black text-[#F3E5AB] uppercase flex items-center gap-1.5">
                <Volume2 className="w-4 h-4 text-[#D4AF37]" />
                Texto de Audio / Conversación por Personaje
              </h3>
              <p className="text-[11px] text-slate-400">
                Diálogos y locución desglosados en español para cada personaje en cámara.
              </p>
            </div>
            <button
              onClick={() => {
                const combined = dialogues.map((d) => `${d.character}: "${d.dialogue}"`).join("\n");
                handleCopy(combined, "copy_all_dialogues");
              }}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              {copiedKey === "copy_all_dialogues" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>Copiar Todos los Diálogos</span>
            </button>
          </div>

          <div className="space-y-3">
            {dialogues.map((item, dIdx) => (
              <div key={dIdx} className="bg-[#0B0D12] p-3.5 rounded-xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <User className="w-3.5 h-3.5 text-[#D4AF37]" />
                    {isEditing ? (
                      <input
                        type="text"
                        value={item.character}
                        onChange={(e) => handleUpdateDialogue(dIdx, "character", e.target.value)}
                        className="bg-slate-900 text-white font-bold text-xs px-2 py-0.5 rounded border border-slate-700 outline-none"
                      />
                    ) : (
                      <span className="text-xs font-bold text-[#F3E5AB]">{item.character}</span>
                    )}
                  </div>
                  <button
                    onClick={() => handleCopy(item.dialogue, `copy_d_${dIdx}`)}
                    className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                  >
                    {copiedKey === `copy_d_${dIdx}` ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                    <span>Copiar</span>
                  </button>
                </div>

                {isEditing ? (
                  <textarea
                    value={item.dialogue}
                    onChange={(e) => handleUpdateDialogue(dIdx, "dialogue", e.target.value)}
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

        {/* 3. Casilla de Código Generado .json */}
        <div className="bg-slate-950/90 p-5 rounded-xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="w-4 h-4 text-purple-400" />
              <div>
                <h3 className="text-xs font-black text-white uppercase">
                  Código Generado .json para Flow
                </h3>
                <p className="text-[11px] text-slate-400">
                  Estructura lista para exportar o importar en Google Labs Flow / Extensiones.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(generatedJson || promptEn, "copy_json_code")}
                className="px-3 py-1.5 bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#F3E5AB] font-bold rounded-lg text-xs border border-[#D4AF37]/40 flex items-center gap-1.5 cursor-pointer transition"
              >
                {copiedKey === "copy_json_code" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedKey === "copy_json_code" ? "¡JSON Copiado!" : "Copiar JSON"}</span>
              </button>

              <button
                onClick={handleDownloadJson}
                className="px-3.5 py-1.5 bg-gradient-to-r from-[#D4AF37] to-[#B89628] hover:brightness-110 text-slate-950 font-black rounded-lg text-xs flex items-center gap-1.5 cursor-pointer shadow-sm transition"
              >
                {downloadSuccess ? <Check className="w-3.5 h-3.5" /> : <Download className="w-3.5 h-3.5" />}
                <span>{downloadSuccess ? "¡Descargado!" : "Descargar .json"}</span>
              </button>
            </div>
          </div>

          <textarea
            readOnly={!isEditing}
            value={
              generatedJson ||
              JSON.stringify(
                {
                  scene_number: 1,
                  theme: isCustomThemeMode ? customTheme : selectedTheme,
                  city: targetCity,
                  aspect_ratio: aspectRatio,
                  characters: characterNames.slice(0, characterCount),
                  elements: selectedElements,
                  guion_es: guionEs,
                  prompt_en: promptEn,
                  image_prompt: imagePrompt,
                  audio_dialogues: dialogues,
                },
                null,
                2
              )
            }
            onChange={(e) => setGeneratedJson(e.target.value)}
            rows={10}
            className="w-full bg-[#0B0D12] text-purple-300 p-4 rounded-xl text-xs font-mono outline-none border border-slate-800 leading-relaxed"
          />
        </div>
      </div>
    </div>
  );
};
