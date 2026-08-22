import React, { useState } from "react";
import {
  Clapperboard,
  Sparkles,
  Download,
  Copy,
  Check,
  Film,
  Smartphone,
  Monitor,
  Share2,
  TrendingUp,
  FileCode,
  ExternalLink,
  MessageSquare,
  Zap,
  CheckCircle2,
  Plus,
  Trash2,
  RotateCcw,
  Volume2,
  User,
  Image as ImageIcon,
  Building,
  Layers,
  Loader2,
  Wand2
} from "lucide-react";
import type { AppUser, Lead } from "@/src/types/property";

interface MarketingStudioViewProps {
  currentUser: AppUser;
  leads?: Lead[];
}

export interface FlowAssetTokens {
  model1: string;
  enableModel2: boolean;
  model2: string;
  logo: string;
  escena: string;
  producto: string;
  afiche: string;
}

export interface SceneItem {
  scene_number: number;
  title: string;
  user_idea: string;
  spanish_description: string;
  narration: string;
  image_prompt: string;
  video_prompt: string;
}

export const MarketingStudioView: React.FC<MarketingStudioViewProps> = ({ currentUser, leads = [] }) => {
  const [activeSubTab, setActiveSubTab] = useState<"generator" | "extension" | "dmo" | "telemetry">("generator");
  
  // ── Controles de Configuración General ──
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "16:9">("9:16");
  const [targetCity, setTargetCity] = useState<string>("Santa Cruz");
  const [forceSpanishAudio, setForceSpanishAudio] = useState<boolean>(true);
  const [isAssetDrawerOpen, setIsAssetDrawerOpen] = useState<boolean>(false);

  // ── 5 Slots de Referencia Multimodal (@ Tokens para Google Labs Flow) ──
  const [assetTokens, setAssetTokens] = useState<FlowAssetTokens>({
    model1: "HRP Modelo WARA 02.jpeg",
    enableModel2: false,
    model2: "HRP Cliente COMPRADOR.jpeg",
    logo: "logo.a.png",
    escena: "ático SCZ 01.jpg",
    producto: "UI_Cotizador_VIS.png",
    afiche: "Afiche_48000_USD.png",
  });

  // ── Datos de Contacto de Red ──
  const [advisorName, setAdvisorName] = useState<string>(currentUser.fullName || "Asesor Property OS");
  const [advisorPhone, setAdvisorPhone] = useState<string>("59170000000");

  // ── Feedback UI & Estado de IA ──
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);

  // ── Lista de Escenas Libres y Dinámicas ──
  const [scenes, setScenes] = useState<SceneItem[]>([
    {
      scene_number: 1,
      title: "Crédito VIS & Cuotas ($285/mes)",
      user_idea: "Explicar que con crédito de vivienda social VIS al 5.5% compran departamento de $48,000 pagando $285/mes de cuota bancaria en vez de alquiler.",
      spanish_description: "Asesora en penthouse mostrando tablet con cotizador interactivo de crédito VIS al 5.5%.",
      narration: "Si sigues creyendo que necesitas cincuenta mil dólares para comprar tu primer departamento en Santa Cruz, estás perdiendo dinero. Con el Crédito VIS la tasa es del 5.5% fijada por ley. Por un departamento de 48,000 dólares pagas 285 dólares al mes, exactamente lo de un alquiler. Comenta CALCULAR y te paso el simulador oficial a tu WhatsApp.",
      image_prompt: "Cinematic vertical 9:16 portrait (full 1080x1920 resolution) of a 30-year-old Latina real estate professional @HRP Modelo WARA 02.jpeg; she is holding a glass tablet displaying the 5.5% VIS social mortgage calculator @UI_Cotizador_VIS.png; set in a modern luxury executive penthouse in Santa Cruz @ático SCZ 01.jpg with branded seal @logo.a.png; diffused 5600K key lighting with subtle 3200K champagne-gold rim lighting; hyper-realistic 8K, 9:16 aspect ratio --ar 9:16, Spanish-language audio.",
      video_prompt: "Camera performs a slow cinematic push-in in 9:16 towards the advisor @HRP Modelo WARA 02.jpeg as she smiles confidently and taps the glass tablet screen showing the mortgage calculation @UI_Cotizador_VIS.png, inside @ático SCZ 01.jpg, smooth 24fps movement, 5600K lighting, Audio: Native clear neutral Latin American Spanish voiceover speaking strictly in Spanish: 'Si sigues creyendo que necesitas cincuenta mil dólares para comprar tu primer departamento en Santa Cruz, estás perdiendo dinero. Con el Crédito VIS la tasa es del 5.5% fijada por ley. Por un departamento de 48,000 dólares pagas 285 dólares al mes, exactamente lo de un alquiler. Comenta CALCULAR y te paso el simulador oficial a tu WhatsApp.', aspect ratio 9:16 --ar 9:16"
    },
    {
      scene_number: 2,
      title: "Sofía IA Calificando a las 2:30 AM",
      user_idea: "Mostrar cómo Sofía IA atiende y califica compradores en WhatsApp mientras el asesor duerme.",
      spanish_description: "Asesora sosteniendo smartphone que muestra a Sofía IA calificando prospectos con BANT.",
      narration: "Son las dos y media de la madrugada y acabo de calificar a un comprador listo para firmar. Mientras descansas, nuestra asistente Sofía IA atiende a tus clientes en WhatsApp, califica su presupuesto con BANT y agenda la visita en Google Calendar. Comenta BOT para probar el simulador gratis.",
      image_prompt: "Cinematic vertical 9:16 portrait (full 1080x1920 resolution) of a 30-year-old Latina real estate professional @HRP Modelo WARA 02.jpeg; holding a modern smartphone displaying \"Sofía IA\" (automated WhatsApp assistant) with @logo.a.png; set in penthouse @ático SCZ 01.jpg; 5600K diffused lighting, 8k, aspect ratio 9:16 --ar 9:16, Spanish-language audio.",
      video_prompt: "Slow cinematic pan in 9:16 focusing on the advisor @HRP Modelo WARA 02.jpeg presenting the smartphone with \"Sofía IA\" @logo.a.png as buyer appointments are qualified in WhatsApp, inside @ático SCZ 01.jpg, 24fps, Audio: Native clear neutral Latin American Spanish voiceover speaking strictly in Spanish: 'Son las dos y media de la madrugada y acabo de calificar a un comprador listo para firmar. Mientras descansas, nuestra asistente Sofía IA atiende a tus clientes en WhatsApp, califica su presupuesto con BANT y agenda la visita en Google Calendar. Comenta BOT para probar el simulador gratis.', aspect ratio 9:16 --ar 9:16"
    }
  ]);

  const [selectedSceneIndex, setSelectedSceneIndex] = useState<number>(0);
  const currentScene = scenes[selectedSceneIndex] || scenes[0];

  // ── Invocación de IA para Traducir y Generar Prompts Cinematográficos ──
  const handleGenerateAiPrompt = async (idxToProcess: number) => {
    const targetScene = scenes[idxToProcess];
    if (!targetScene) return;

    setIsGeneratingAi(true);
    setAiError(null);

    try {
      const response = await fetch("/api/ai/compile-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: targetScene.user_idea || targetScene.title,
          spanishDescription: targetScene.spanish_description,
          narration: targetScene.narration,
          city: targetCity,
          aspectRatio: aspectRatio,
          tokens: assetTokens,
          forceSpanishAudio: forceSpanishAudio,
        }),
      });

      if (!response.ok) {
        throw new Error(`Error en el servidor de IA (${response.status})`);
      }

      const data = await response.json();

      const updated = [...scenes];
      updated[idxToProcess] = {
        ...targetScene,
        spanish_description: data.spanish_description || targetScene.spanish_description,
        narration: data.narration || targetScene.narration,
        video_prompt: data.video_prompt || targetScene.video_prompt,
        image_prompt: data.image_prompt || targetScene.image_prompt,
      };

      setScenes(updated);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error al conectar con el motor de IA";
      setAiError(msg);
      console.error("[MarketingStudioView] Error generando con IA:", err);
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // ── Añadir Nueva Escena Libre ──
  const handleAddNewScene = () => {
    const nextNum = scenes.length + 1;
    const newScene: SceneItem = {
      scene_number: nextNum,
      title: `Escena ${nextNum}`,
      user_idea: "",
      spanish_description: "",
      narration: "",
      image_prompt: "",
      video_prompt: "",
    };
    const updated = [...scenes, newScene];
    setScenes(updated);
    setSelectedSceneIndex(updated.length - 1);
  };

  // ── Eliminar Escena ──
  const handleDeleteScene = (idxToDelete: number) => {
    if (scenes.length <= 1) return;
    const filtered = scenes
      .filter((_, idx) => idx !== idxToDelete)
      .map((s, idx) => ({ ...s, scene_number: idx + 1 }));
    setScenes(filtered);
    setSelectedSceneIndex(Math.max(0, idxToDelete - 1));
  };

  // ── Actualizar Campo de Escena ──
  const handleUpdateField = (field: keyof SceneItem, value: string) => {
    const updated = [...scenes];
    updated[selectedSceneIndex] = {
      ...updated[selectedSceneIndex],
      [field]: value,
    };
    setScenes(updated);
  };

  // ── Copiar al Portapapeles ──
  const handleCopyPrompt = (text: string, id: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  // ── Descargar script.json Completo ──
  const handleDownloadScriptJson = () => {
    const exportData = {
      scenes: scenes.map((s) => ({
        scene_number: s.scene_number,
        title: s.title,
        image_prompt: s.image_prompt,
        video_prompt: s.video_prompt,
        narration: s.narration,
      })),
    };
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "script.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3500);
  };

  // Conteo de leads por palabra clave
  const keywordStats = {
    CALCULAR: leads.filter((l) => l.aiSummary?.toLowerCase().includes("vis") || l.paymentMethod === "CREDITO_VIS").length,
    BOT: leads.filter((l) => l.sourceChannel === "BOT_SIMULATOR" || l.pipelineType === "VENTAS").length,
    AUDITORIA: leads.filter((l) => l.pipelineType === "CAPTACIONES").length,
    PRECIO: leads.filter((l) => l.leadType === "SELLER_OWNER").length,
    TOUR: leads.filter((l) => l.pipelineStage === "VISITA_AGENDADA" || l.pipelineStage === "VISITA_REALIZADA").length,
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
                  <Clapperboard className="w-6 h-6 text-[#D4AF37]" />
                </div>
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-black text-white tracking-tight flex items-center gap-2">
                  Marketing Studio & Video Engine
                  <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#F3E5AB]">
                    Flow Multimodal IA
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Generación de spots con IA y tokens <code className="text-[#D4AF37]">@</code> para Google Labs Flow / Veo 2.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsAssetDrawerOpen(!isAssetDrawerOpen)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                isAssetDrawerOpen
                  ? "bg-[#D4AF37] text-slate-950 border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                  : "bg-[#111622] hover:bg-[#1A2234] text-[#F3E5AB] border-slate-700 hover:border-[#D4AF37]/50"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Tokens @ Flow ({Object.keys(assetTokens).length - 1} Slots)</span>
            </button>

            <a
              href="https://labs.google/flow"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-[#111622] hover:bg-[#1A2234] border border-slate-700 hover:border-[#D4AF37]/50 text-[#F3E5AB] font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Abrir Flow</span>
            </a>

            <button
              onClick={handleDownloadScriptJson}
              className="px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-[#B89628] hover:brightness-110 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all cursor-pointer"
            >
              {downloadSuccess ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
              <span>{downloadSuccess ? "¡script.json Listo!" : `Exportar script.json (${scenes.length})`}</span>
            </button>
          </div>
        </div>

        {/* ── Subtabs de Navegación ── */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-800/80">
          {[
            { id: "generator", label: "🎬 Creador de Prompts con IA", icon: Sparkles },
            { id: "extension", label: "🧩 Extensión Chrome", icon: FileCode },
            { id: "dmo", label: "📱 Biblioteca DMO & Red", icon: Share2 },
            { id: "telemetry", label: "📊 Telemetría de Campañas", icon: TrendingUp },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as typeof activeSubTab)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? "bg-[#D4AF37]/15 text-[#F3E5AB] border border-[#D4AF37]/40 shadow-xs"
                    : "bg-[#111622]/60 hover:bg-[#111622] text-slate-400 hover:text-slate-200 border border-slate-800"
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? "text-[#D4AF37]" : "text-slate-500"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── DRAWER DE ASSETS @ FLOW (CONFIGURACIÓN DE TOKENS) ── */}
      {isAssetDrawerOpen && (
        <div className="bg-[#111622] border-2 border-[#D4AF37]/60 rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#D4AF37]" />
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Configuración de Assets en Google Labs Flow
                </h3>
                <p className="text-[11px] text-slate-400">
                  Nombres exactos de los archivos subidos al canvas de Flow. La IA los inyectará como <code className="text-[#D4AF37]">@nombre_archivo</code>.
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsAssetDrawerOpen(false)}
              className="px-3 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg text-xs font-bold cursor-pointer"
            >
              Guardar y Cerrar
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {/* Slot 1: Personaje Principal */}
            <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1.5">
              <label className="text-[10px] font-bold text-[#D4AF37] uppercase flex items-center gap-1">
                <User className="w-3 h-3" />
                1. Token Personaje 1 (@image_modelo)
              </label>
              <input
                type="text"
                value={assetTokens.model1}
                onChange={(e) => setAssetTokens({ ...assetTokens, model1: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono outline-none focus:ring-1 focus:ring-[#D4AF37]"
                placeholder="ej. HRP Modelo WARA 02.jpeg"
              />
              <p className="text-[10px] text-slate-500">Hoja de referencia del rostro/vestimenta.</p>
            </div>

            {/* Slot 2: Personaje Secundario (Opcional) */}
            <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-slate-300 uppercase flex items-center gap-1">
                  <User className="w-3 h-3 text-purple-400" />
                  2. Personaje 2 (Cliente / Coprotagonista)
                </label>
                <input
                  type="checkbox"
                  checked={assetTokens.enableModel2}
                  onChange={(e) => setAssetTokens({ ...assetTokens, enableModel2: e.target.checked })}
                  className="rounded accent-[#D4AF37] cursor-pointer"
                />
              </div>
              <input
                type="text"
                disabled={!assetTokens.enableModel2}
                value={assetTokens.model2}
                onChange={(e) => setAssetTokens({ ...assetTokens, model2: e.target.value })}
                className={`w-full bg-slate-950 border rounded-lg p-2 text-xs font-mono outline-none ${
                  assetTokens.enableModel2 ? "border-slate-800 text-slate-200 focus:ring-1 focus:ring-[#D4AF37]" : "border-slate-900 text-slate-600 opacity-50"
                }`}
                placeholder="ej. HRP Cliente COMPRADOR.jpeg"
              />
              <p className="text-[10px] text-slate-500">Activa si interactúan 2 personas en cámara.</p>
            </div>

            {/* Slot 3: Logo / Branding */}
            <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1.5">
              <label className="text-[10px] font-bold text-amber-400 uppercase flex items-center gap-1">
                <ImageIcon className="w-3 h-3" />
                3. Token Logo / UI (@image_logo)
              </label>
              <input
                type="text"
                value={assetTokens.logo}
                onChange={(e) => setAssetTokens({ ...assetTokens, logo: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono outline-none focus:ring-1 focus:ring-[#D4AF37]"
                placeholder="ej. logo.a.png"
              />
              <p className="text-[10px] text-slate-500">Isotipo 3D o logotipo en pantalla.</p>
            </div>

            {/* Slot 4: Escenario */}
            <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1.5">
              <label className="text-[10px] font-bold text-emerald-400 uppercase flex items-center gap-1">
                <Building className="w-3 h-3" />
                4. Token Escenario (@image_escena)
              </label>
              <input
                type="text"
                value={assetTokens.escena}
                onChange={(e) => setAssetTokens({ ...assetTokens, escena: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono outline-none focus:ring-1 focus:ring-[#D4AF37]"
                placeholder="ej. ático SCZ 01.jpg"
              />
              <p className="text-[10px] text-slate-500">Foto del set, balcón, living o sala.</p>
            </div>

            {/* Slot 5: Producto / UI */}
            <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1.5">
              <label className="text-[10px] font-bold text-blue-400 uppercase flex items-center gap-1">
                <Smartphone className="w-3 h-3" />
                5. Token Producto (@image_producto)
              </label>
              <input
                type="text"
                value={assetTokens.producto}
                onChange={(e) => setAssetTokens({ ...assetTokens, producto: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono outline-none focus:ring-1 focus:ring-[#D4AF37]"
                placeholder="ej. UI_Cotizador_VIS.png"
              />
              <p className="text-[10px] text-slate-500">Pantalla de la app, cotizador o semáforo legal.</p>
            </div>

            {/* Slot 6: Afiche Publicitario */}
            <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1.5">
              <label className="text-[10px] font-bold text-rose-400 uppercase flex items-center gap-1">
                <Film className="w-3 h-3" />
                6. Token Afiche (@image_afiche)
              </label>
              <input
                type="text"
                value={assetTokens.afiche}
                onChange={(e) => setAssetTokens({ ...assetTokens, afiche: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-slate-200 font-mono outline-none focus:ring-1 focus:ring-[#D4AF37]"
                placeholder="ej. Afiche_48000_USD.png"
              />
              <p className="text-[10px] text-slate-500">Banner comercial con precio o condiciones.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── SUBTAB 1: CREADOR DE PROMPTS CON IA (ESPACIO AMPLIO Y MANEJABLE) ── */}
      {activeSubTab === "generator" && (
        <div className="space-y-4">
          {/* Barra de Ajustes Globales */}
          <div className="bg-[#111622] border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-300">Formato:</span>
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => setAspectRatio("9:16")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                    aspectRatio === "9:16" ? "bg-[#D4AF37]/20 text-[#F3E5AB] border border-[#D4AF37]/40" : "text-slate-400"
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5 inline mr-1" />
                  9:16 Vertical (TikTok/Reels)
                </button>
                <button
                  onClick={() => setAspectRatio("16:9")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition cursor-pointer ${
                    aspectRatio === "16:9" ? "bg-[#D4AF37]/20 text-[#F3E5AB] border border-[#D4AF37]/40" : "text-slate-400"
                  }`}
                >
                  <Monitor className="w-3.5 h-3.5 inline mr-1" />
                  16:9 Horizontal (YouTube/Web)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs">
                <span className="text-slate-400">Ciudad:</span>
                <select
                  value={targetCity}
                  onChange={(e) => setTargetCity(e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-200 font-bold outline-none"
                >
                  <option value="Santa Cruz">📍 Santa Cruz</option>
                  <option value="La Paz">📍 La Paz</option>
                  <option value="Cochabamba">📍 Cochabamba</option>
                  <option value="Bolivia">📍 Bolivia (Nacional)</option>
                </select>
              </div>

              <button
                onClick={() => setForceSpanishAudio(!forceSpanishAudio)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1.5 cursor-pointer ${
                  forceSpanishAudio
                    ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                    : "bg-slate-950 border-slate-800 text-slate-400"
                }`}
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>{forceSpanishAudio ? "Locución en Español: ON" : "Locución en Español: OFF"}</span>
              </button>
            </div>
          </div>

          {/* Consola Principal: Selector de Escenas + Editor Amplio */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Columna Izquierda (3 cols): Lista Dinámica de Escenas */}
            <div className="lg:col-span-3 space-y-2">
              <div className="bg-[#111622] border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                  <span className="text-xs font-black text-white uppercase tracking-wider">
                    Escenas del Lote ({scenes.length})
                  </span>
                  <button
                    onClick={handleAddNewScene}
                    className="text-xs font-bold text-[#D4AF37] hover:text-[#F3E5AB] flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> + Añadir
                  </button>
                </div>

                <div className="space-y-1.5 max-h-[500px] overflow-y-auto pr-1">
                  {scenes.map((s, idx) => (
                    <div
                      key={s.scene_number}
                      onClick={() => setSelectedSceneIndex(idx)}
                      className={`p-3 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer border ${
                        selectedSceneIndex === idx
                          ? "bg-[#D4AF37]/15 border-[#D4AF37]/50 text-[#F3E5AB] shadow-sm"
                          : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="w-6 h-6 rounded-lg bg-slate-950 text-[#D4AF37] flex items-center justify-center text-xs font-black shrink-0">
                          {s.scene_number}
                        </span>
                        <span className="truncate">{s.title || `Escena ${s.scene_number}`}</span>
                      </div>

                      {scenes.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteScene(idx);
                          }}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded transition"
                          title="Eliminar escena"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Columna Derecha (9 cols): Editor Amplio y Generación IA */}
            <div className="lg:col-span-9 space-y-4">
              {aiError && (
                <div className="p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-300 text-xs">
                  ⚠️ {aiError}
                </div>
              )}

              {/* Bloque 1: Idea / Datos de Entrada del Usuario */}
              <div className="bg-[#111622] border border-slate-800 rounded-2xl p-5 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#F3E5AB] font-black text-sm flex items-center justify-center">
                      {currentScene.scene_number}
                    </span>
                    <input
                      type="text"
                      value={currentScene.title}
                      onChange={(e) => handleUpdateField("title", e.target.value)}
                      placeholder="Título de la Escena (ej. Crédito VIS $285/mes)"
                      className="bg-transparent text-white font-black text-sm outline-none border-b border-transparent focus:border-[#D4AF37] w-64"
                    />
                  </div>

                  <button
                    onClick={() => handleGenerateAiPrompt(selectedSceneIndex)}
                    disabled={isGeneratingAi}
                    className="px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-[#B89628] hover:brightness-110 disabled:opacity-50 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 transition cursor-pointer shadow-md"
                  >
                    {isGeneratingAi ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Generando y Traduciendo con IA...</span>
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4" />
                        <span>✨ Generar & Traducir con IA para Flow</span>
                      </>
                    )}
                  </button>
                </div>

                <div>
                  <label className="text-xs font-bold text-[#F3E5AB] block mb-1">
                    💡 Idea, Propósito o Datos Clave de esta Escena (Escribe libremente en Español):
                  </label>
                  <textarea
                    value={currentScene.user_idea}
                    onChange={(e) => handleUpdateField("user_idea", e.target.value)}
                    rows={2}
                    placeholder="Ejemplo: Quiero un spot donde la asesora muestre en su tablet cómo con $285 al mes compras un departamento de $48,000 en Santa Cruz con Crédito VIS, dejando de pagar alquiler..."
                    className="w-full bg-slate-950 text-slate-100 p-3 rounded-xl text-xs outline-none border border-slate-800 focus:border-[#D4AF37] leading-relaxed"
                  />
                </div>
              </div>

              {/* Bloque 2: Ventanas Amplias de Resultados (Español vs Flow English) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Ventana A: Locución y Guión en Español */}
                <div className="bg-[#111622] border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-[#F3E5AB] uppercase flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-[#D4AF37]" />
                        Guión de Locución / Narration (Español)
                      </span>
                      <button
                        onClick={() => handleCopyPrompt(currentScene.narration, "copy_narration")}
                        className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        {copiedIndex === "copy_narration" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedIndex === "copy_narration" ? "¡Copiado!" : "Copiar"}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Texto exacto que dirá la locutora en el video (10 a 20 segundos).
                    </p>
                    <textarea
                      value={currentScene.narration}
                      onChange={(e) => handleUpdateField("narration", e.target.value)}
                      rows={6}
                      placeholder="El guión en español generado por IA aparecerá aquí..."
                      className="w-full bg-slate-950 text-slate-200 p-3 rounded-xl text-xs italic outline-none border border-slate-800 focus:border-[#D4AF37] leading-relaxed min-h-[160px]"
                    />
                  </div>

                  <div className="pt-2 border-t border-slate-800/80">
                    <label className="text-[10px] font-bold text-slate-400 block mb-1">Descripción Visual (Español):</label>
                    <input
                      type="text"
                      value={currentScene.spanish_description}
                      onChange={(e) => handleUpdateField("spanish_description", e.target.value)}
                      placeholder="Descripción de la acción visual..."
                      className="w-full bg-slate-950 text-slate-300 p-2 rounded-lg text-xs outline-none border border-slate-800"
                    />
                  </div>
                </div>

                {/* Ventana B: Prompt de Video para Google Labs Flow (Inglés + Tokens @) */}
                <div className="bg-[#111622] border border-slate-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-400 uppercase flex items-center gap-1.5">
                        <Film className="w-4 h-4 text-emerald-400" />
                        Prompt de Video para Google Labs Flow (@)
                      </span>
                      <button
                        onClick={() => handleCopyPrompt(currentScene.video_prompt, "copy_video_prompt")}
                        className="px-3 py-1 bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#F3E5AB] font-black rounded-lg text-xs border border-[#D4AF37]/40 flex items-center gap-1.5 cursor-pointer transition"
                      >
                        {copiedIndex === "copy_video_prompt" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedIndex === "copy_video_prompt" ? "¡Copiado para Flow!" : "Copiar para Flow"}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Prompt optimizado en inglés con inyección de tokens <code className="text-[#D4AF37]">@</code> y audio en español.
                    </p>
                    <textarea
                      value={currentScene.video_prompt}
                      onChange={(e) => handleUpdateField("video_prompt", e.target.value)}
                      rows={6}
                      placeholder="El prompt en inglés con tokens @ para Flow aparecerá aquí al presionar Generar..."
                      className="w-full bg-[#0B0D12] text-slate-200 p-3 rounded-xl text-xs font-mono outline-none border border-slate-800 focus:border-[#D4AF37] leading-relaxed min-h-[160px]"
                    />
                  </div>

                  {/* Start Frame / Imagen Fija */}
                  <div className="pt-2 border-t border-slate-800/80">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-[#D4AF37] uppercase">Start Frame / Imagen Fija (@):</span>
                      <button
                        onClick={() => handleCopyPrompt(currentScene.image_prompt, "copy_image_prompt")}
                        className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                      >
                        {copiedIndex === "copy_image_prompt" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>Copiar Imagen</span>
                      </button>
                    </div>
                    <input
                      type="text"
                      value={currentScene.image_prompt}
                      onChange={(e) => handleUpdateField("image_prompt", e.target.value)}
                      placeholder="Prompt de imagen fija 8k..."
                      className="w-full bg-[#0B0D12] text-slate-400 p-2 rounded-lg text-[11px] font-mono outline-none border border-slate-800"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SUBTAB 2: EXTENSIÓN CHROME SUITE ── */}
      {activeSubTab === "extension" && (
        <div className="bg-[#111622] border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <FileCode className="w-5 h-5 text-[#D4AF37]" />
                Suite de Extensión Chrome: Property AI Content Generator
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Automatización de generación por lotes en Google Labs Flow sin intervención manual.
              </p>
            </div>

            <a
              href="https://chromewebstore.google.com/detail/ai-content-generator/dedbhpgnibeepfeickmhfifmdhiljmnh"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-[#B89628] hover:brightness-110 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-xs transition"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Instalar desde Chrome Web Store</span>
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-2">
              <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/15 text-[#F3E5AB] font-black text-sm flex items-center justify-center">
                1
              </div>
              <h4 className="text-xs font-bold text-white">Descarga script.json</h4>
              <p className="text-[11px] text-slate-400">
                Usa el botón superior para descargar el archivo <code className="text-[#D4AF37]">script.json</code> con tus escenas y tokens <code className="text-slate-300">@</code> compilados.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 font-black text-sm flex items-center justify-center">
                2
              </div>
              <h4 className="text-xs font-bold text-white">Selecciona Carpeta en Flow</h4>
              <p className="text-[11px] text-slate-400">
                Abre Google Labs Flow, presiona el icono de la extensión y selecciona la carpeta con tu <code className="text-emerald-400">script.json</code>.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 font-black text-sm flex items-center justify-center">
                3
              </div>
              <h4 className="text-xs font-bold text-white">Renderizado Automático</h4>
              <p className="text-[11px] text-slate-400">
                Presiona "Start Batch" para que la extensión inyecte los prompts en segundo plano en Flow.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── SUBTAB 3: BIBLIOTECA DMO & RED ── */}
      {activeSubTab === "dmo" && (
        <div className="bg-[#111622] border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Share2 className="w-5 h-5 text-[#D4AF37]" />
                Biblioteca DMO (Acción Diaria) & Social Selling
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Packs de copys listos para publicar en Historias, Reels y TikTok con tu enlace de WhatsApp.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800 text-xs">
              <input
                type="text"
                value={advisorName}
                onChange={(e) => setAdvisorName(e.target.value)}
                placeholder="Nombre del Asesor"
                className="bg-transparent text-white px-2 py-1 outline-none text-xs font-bold w-36"
              />
              <input
                type="text"
                value={advisorPhone}
                onChange={(e) => setAdvisorPhone(e.target.value)}
                placeholder="WhatsApp (ej. 59170000000)"
                className="bg-transparent text-slate-300 px-2 py-1 outline-none text-xs font-mono w-32 border-l border-slate-800"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Pack Historia 1: Gancho VIS
              </span>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                "¿Sabías que por ley puedes financiar tu departamento al 5.5% fijo y pagar menos de cuota que lo que pagas hoy de alquiler? 🏠 Comenta <b>CALCULAR</b> o escríbeme y te paso el simulador bancario en 5 segundos 👇"
              </p>
              <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center text-[11px] text-slate-400">
                <span>Enlace: <code>wa.me/{advisorPhone}?text=CALCULAR</code></span>
                <button
                  onClick={() => handleCopyPrompt(`¿Sabías que por ley puedes financiar tu departamento al 5.5% fijo y pagar menos de cuota que lo que pagas hoy de alquiler? 🏠 Comenta CALCULAR o escríbeme a https://wa.me/${advisorPhone}?text=CALCULAR y te paso el simulador bancario en 5 segundos 👇`, "dmo_vis")}
                  className="px-2.5 py-1 bg-[#D4AF37]/15 text-[#F3E5AB] font-bold rounded-lg text-xs hover:bg-[#D4AF37]/30 transition cursor-pointer"
                >
                  {copiedIndex === "dmo_vis" ? "¡Copiado!" : "Copiar Pack"}
                </button>
              </div>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 space-y-3">
              <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                Pack Historia 2: Seguridad Legal
              </span>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                "Antes de dar un centavo de reserva por una propiedad, exige el Semáforo Legal de Folio Real y Catastro. 🛡️ Nosotros auditamos la documentación antes de firmar cualquier minuta. Escríbeme <b>AUDITORIA</b> para evaluar tu caso."
              </p>
              <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center text-[11px] text-slate-400">
                <span>Enlace: <code>wa.me/{advisorPhone}?text=AUDITORIA</code></span>
                <button
                  onClick={() => handleCopyPrompt(`Antes de dar un centavo de reserva por una propiedad, exige el Semáforo Legal de Folio Real y Catastro. 🛡️ Nosotros auditamos la documentación antes de firmar cualquier minuta. Escríbeme AUDITORIA a https://wa.me/${advisorPhone}?text=AUDITORIA para evaluar tu caso.`, "dmo_auditoria")}
                  className="px-2.5 py-1 bg-[#D4AF37]/15 text-[#F3E5AB] font-bold rounded-lg text-xs hover:bg-[#D4AF37]/30 transition cursor-pointer"
                >
                  {copiedIndex === "dmo_auditoria" ? "¡Copiado!" : "Copiar Pack"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SUBTAB 4: TELEMETRÍA DE CAMPAÑAS ── */}
      {activeSubTab === "telemetry" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { keyword: "CALCULAR / VIS", count: keywordStats.CALCULAR, label: "Simuladores Entregados" },
              { keyword: "BOT / SISTEMA", count: keywordStats.BOT, label: "Demos de Sofía IA" },
              { keyword: "AUDITORIA", count: keywordStats.AUDITORIA, label: "Consultas Legales" },
              { keyword: "PRECIO", count: keywordStats.PRECIO, label: "Captaciones de Inmuebles" },
              { keyword: "TOUR", count: keywordStats.TOUR, label: "Visitas Agendadas" },
            ].map((stat) => (
              <div
                key={stat.keyword}
                className="bg-[#111622] border border-slate-800 p-4 rounded-2xl space-y-1 relative overflow-hidden"
              >
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block font-mono">
                  {stat.keyword}
                </span>
                <p className="text-2xl font-black text-white">{stat.count}</p>
                <p className="text-[10px] text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>

          <div className="bg-[#111622] border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-black text-white flex items-center gap-2">
              <Zap className="w-4 h-4 text-[#D4AF37]" />
              Estado de Integración de Webhooks & Triggers de DMs
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-emerald-400 uppercase flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Webhook de Captura Supabase
                </span>
                <p className="text-slate-300 font-mono text-[11px] break-all bg-slate-950 p-2 rounded-lg">
                  https://property-app-ashen.vercel.app/api/whatsapp/webhook
                </p>
                <p className="text-[11px] text-slate-500">
                  Captura automática de leads con telemetría BANT e inyección en Kanban.
                </p>
              </div>

              <div className="bg-slate-900/80 p-4 rounded-xl border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-[#F3E5AB] uppercase flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />
                  Archivo de Flujos Configurado
                </span>
                <p className="text-slate-300 font-mono text-[11px] bg-slate-950 p-2 rounded-lg">
                  DM_CONVERSATION_FLOWS.json (5 Embudos Activos)
                </p>
                <p className="text-[11px] text-slate-500">
                  Árboles de decisión listos para automatización de respuestas.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
