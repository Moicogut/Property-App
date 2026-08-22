import React, { useState } from "react";
import {
  Clapperboard,
  Sparkles,
  Download,
  Copy,
  Check,
  Play,
  Film,
  Smartphone,
  Monitor,
  Share2,
  ShieldCheck,
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
  Edit3,
  Layers,
  Languages,
  Eye
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
  day_label?: string;
  theme_key?: string;
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
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>("TODOS");
  const [forceSpanishAudio, setForceSpanishAudio] = useState<boolean>(true);
  const [isAssetDrawerOpen, setIsAssetDrawerOpen] = useState<boolean>(false);
  const [showGoldenSample, setShowGoldenSample] = useState<boolean>(false);

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

  // ── Feedback UI ──
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [editingSceneIdx, setEditingSceneIdx] = useState<number | null>(null);
  const [activeMode, setActiveMode] = useState<"individual" | "batch">("individual");
  const [selectedSceneNumber, setSelectedSceneNumber] = useState<number>(1);

  // ── Generador de Prompts Cinematográficos con Tokens @ ──
  const buildPromptsForScene = (
    sceneNum: number,
    theme: string,
    spanishDesc: string,
    narrationText: string,
    tokens: FlowAssetTokens,
    ratio: "9:16" | "16:9",
    city: string,
    spanishAudio: boolean
  ) => {
    const isVertical = ratio === "9:16";
    const resText = isVertical ? "full 1080x1920 resolution" : "full 1920x1080 resolution";
    const model2Part = tokens.enableModel2 ? ` interacting with a buyer client @${tokens.model2}` : "";
    const audioDirective = spanishAudio
      ? `Audio: Native clear neutral Latin American Spanish voiceover speaking strictly in Spanish: '${narrationText.replace(/'/g, "")}', `
      : "";

    let imagePrompt = "";
    let videoPrompt = "";

    switch (sceneNum) {
      case 1:
        imagePrompt = `Cinematic vertical ${ratio} portrait (${resText}) of a 30-year-old Latina real estate professional @${tokens.model1}${model2Part}; she is holding a glass tablet displaying the 5.5% VIS social mortgage calculator @${tokens.producto}; set in a modern luxury executive penthouse in ${city} @${tokens.escena} with branded seal @${tokens.logo}; diffused 5600K key lighting with subtle 3200K champagne-gold rim lighting; hyper-realistic 8K, ${ratio} aspect ratio --ar ${ratio}, Spanish-language audio.`;
        videoPrompt = `Camera performs a slow cinematic push-in in ${ratio} towards the advisor @${tokens.model1} as she smiles confidently and taps the glass tablet screen showing the mortgage calculation @${tokens.producto}, inside @${tokens.escena}, smooth 24fps movement, 5600K lighting, ${audioDirective}aspect ratio ${ratio} --ar ${ratio}`;
        break;
      case 2:
        imagePrompt = `Cinematic vertical ${ratio} portrait (${resText}) of a 30-year-old Latina real estate professional @${tokens.model1}; she is holding a modern smartphone displaying "Sofía IA" (an automated WhatsApp assistant) actively qualifying real estate buyer leads using the BANT methodology @${tokens.logo}; set in a modern luxury executive penthouse in ${city} @${tokens.escena}; diffused 5600K key lighting with subtle 3200K champagne-gold rim lighting; hyper-realistic 8K, ${ratio} aspect ratio --ar ${ratio}, Spanish-language audio.`;
        videoPrompt = `Slow cinematic camera pan in ${ratio} focusing on the advisor @${tokens.model1} presenting the glowing smartphone with "Sofía IA" and the golden brand logo @${tokens.logo} as buyer appointments are booked automatically, inside @${tokens.escena}, 24fps, ${audioDirective}aspect ratio ${ratio} --ar ${ratio}`;
        break;
      case 3:
        imagePrompt = `Cinematic vertical ${ratio} shot (${resText}) of the real estate professional @${tokens.model1} presenting a digital holographic shield for Property Legal Audit with green verification marks for Folio Real and Cadastre @${tokens.producto}; branded with @${tokens.logo}; set in executive lounge @${tokens.escena}; 5600K diffused lighting, 8k, aspect ratio ${ratio} --ar ${ratio}, Spanish-language audio.`;
        videoPrompt = `Camera zooms slightly in ${ratio} into the digital legal audit interface @${tokens.producto} as verification marks glow green while the advisor @${tokens.model1} explains with authority, inside @${tokens.escena}, 24fps, ${audioDirective}aspect ratio ${ratio} --ar ${ratio}`;
        break;
      case 4:
        imagePrompt = `Cinematic vertical ${ratio} medium shot (${resText}) of the real estate advisor @${tokens.model1} reviewing an analytical property valuation heatmap @${tokens.producto} alongside property brochure @${tokens.afiche}; set in penthouse in ${city} @${tokens.escena}; 5600K lighting, 8k, aspect ratio ${ratio} --ar ${ratio}, Spanish-language audio.`;
        videoPrompt = `Gentle camera orbit in ${ratio} around the advisor @${tokens.model1} as she points out price-per-square-meter market analysis on the tablet @${tokens.producto}, inside @${tokens.escena}, smooth 24fps, ${audioDirective}aspect ratio ${ratio} --ar ${ratio}`;
        break;
      case 5:
        imagePrompt = `Cinematic vertical ${ratio} comparison portrait (${resText}) of the modern tech-enabled advisor @${tokens.model1} operating Property OS CRM on a sleek ultrabook @${tokens.producto} with official logo @${tokens.logo}; set in modern boardroom in ${city} @${tokens.escena}; 8k, aspect ratio ${ratio} --ar ${ratio}, Spanish-language audio.`;
        videoPrompt = `Dynamic cinematic transition in ${ratio} showing the advisor @${tokens.model1} generating a digital PDF reservation contract in one click on Property OS @${tokens.producto}, 24fps, ${audioDirective}aspect ratio ${ratio} --ar ${ratio}`;
        break;
      case 6:
        imagePrompt = `Cinematic vertical ${ratio} wide shot (${resText}) of a bright luxury apartment living room in ${city} @${tokens.escena} with promotional banner @${tokens.afiche}; real estate professional @${tokens.model1} gesturing welcomingly towards the panoramic balcony; 8k, aspect ratio ${ratio} --ar ${ratio}, Spanish-language audio.`;
        videoPrompt = `Smooth forward tracking shot in ${ratio} entering the luxury apartment @${tokens.escena} as the advisor @${tokens.model1} guides the viewer toward the balcony view, 24fps, ${audioDirective}aspect ratio ${ratio} --ar ${ratio}`;
        break;
      case 7:
      default:
        imagePrompt = `Cinematic vertical ${ratio} conversational portrait (${resText}) of the real estate professional @${tokens.model1} seated comfortably in executive chair holding coffee cup with logo @${tokens.logo}; engaging directly with camera; set in luxury penthouse @${tokens.escena}; warm 3200K rim lighting, 8k, aspect ratio ${ratio} --ar ${ratio}, Spanish-language audio.`;
        videoPrompt = `Close-up conversational camera angle in ${ratio} as advisor @${tokens.model1} addresses the camera with natural micro-expressions and gestures, inside @${tokens.escena}, 24fps, ${audioDirective}aspect ratio ${ratio} --ar ${ratio}`;
        break;
    }

    return { imagePrompt, videoPrompt };
  };

  // ── Generación Inicial de Escenas ──
  const generateInitialScenes = (tokens: FlowAssetTokens, ratio: "9:16" | "16:9", city: string, spanishAudio: boolean): SceneItem[] => {
    const rawData = [
      {
        num: 1,
        day: "Lunes",
        theme: "Crédito VIS & Cuotas ($285/mes)",
        desc: "Asesora mostrando tablet con cotización de crédito de vivienda social VIS al 5.5% regulado.",
        narration: `Si sigues creyendo que necesitas cincuenta mil dólares para comprar tu primer departamento en ${city}, estás perdiendo dinero. Con el Crédito de Vivienda Social VIS, la tasa está fijada al 5.5% por ley. Por un departamento de 48,000 dólares, tu cuota mensual queda en 285 dólares, exactamente lo que pagas de alquiler. Comenta CALCULAR y te envío el simulador a tu WhatsApp.`
      },
      {
        num: 2,
        day: "Martes",
        theme: "Sofía IA Calificando a las 2:30 AM",
        desc: "Asesora sosteniendo smartphone con WhatsApp abierto mostrando a Sofía IA calificando leads con BANT.",
        narration: `Son las dos y media de la madrugada y acabo de calificar a un comprador listo para firmar minuta. Mientras descansas, nuestra asistente Sofía IA atiende a tus clientes en WhatsApp, califica su presupuesto con telemetría BANT y te agenda la visita en Google Calendar. Comenta BOT para probar el simulador gratis.`
      },
      {
        num: 3,
        day: "Miércoles",
        theme: "Semáforo Legal & Folio Real",
        desc: "Asesora explicando el semáforo legal de 3 pilares: Folio Real, Impuestos RUAT y Catastro Municipal.",
        narration: `Nunca des un centavo de reserva por un inmueble sin antes revisar este semáforo legal. En Bolivia, 4 de cada 10 inmuebles tienen problemas en Derechos Reales: hipotecas no canceladas, deudas en el RUAT o planos no visados. En Property OS auditamos los 3 pilares legales antes de emitir cualquier contrato. Comenta AUDITORIA para evaluar tu caso.`
      },
      {
        num: 4,
        day: "Jueves",
        theme: "Estudio ACM & Valuación de Inmuebles",
        desc: "Asesora analizando mapa de calor de precios por m2 para fijar el valor de venta real sin quemar el inmueble.",
        narration: `¿Tu casa lleva 6 meses en venta y nadie llama? Este es el motivo exacto: el precio por metro cuadrado está desalineado del mercado real. Con nuestro estudio comparativo ACM analizamos la zona exacta para que vendas al mejor valor sin quemar tu propiedad. Comenta PRECIO y valuamos tu inmueble.`
      },
      {
        num: 5,
        day: "Viernes",
        theme: "Asesor Tradicional vs. Asesor con Property OS",
        desc: "Comparativa entre gestión manual en papel vs. generación de contratos digitales y CRM automatizado.",
        narration: `El 90% de los agentes inmobiliarios perderá clientes este año por seguir usando hojas de cálculo y notas en papel. Property OS es el sistema operativo completo con contratos en PDF, cotizador bancario y pipeline automatizado. Si quieres usar esta tecnología o unirte a nuestro equipo de embajadores, comenta SISTEMA.`
      },
      {
        num: 6,
        day: "Sábado",
        theme: "Tour Departamento $65,000 en Zona Residencial",
        desc: "Recorrido por departamento de 2 dormitorios con balcón panorámico apto para crédito VIS.",
        narration: `Te muestro este departamento de 65,000 dólares en la mejor zona residencial de ${city}. Dos dormitorios, cocina equipada y balcón panorámico, apto para crédito VIS con cuota bancaria súper accesible. Comenta TOUR y te paso la ficha técnica completa con ubicación exacta.`
      },
      {
        num: 7,
        day: "Domingo",
        theme: "DMO Social Selling & Objeciones",
        desc: "Asesora en charla cercana respondiendo dudas sobre aporte inicial y estructuración de financiamiento.",
        narration: `Muchas personas me preguntan cuál es el mayor freno para comprar casa este 2026: ¿el aporte inicial o el miedo a las tasas? La clave no es esperar el momento perfecto, sino estructurar tu financiamiento con datos reales. Escríbeme un mensaje directo con tu caso y te asesoramos paso a paso.`
      }
    ];

    return rawData.map((item) => {
      const prompts = buildPromptsForScene(
        item.num,
        item.theme,
        item.desc,
        item.narration,
        tokens,
        ratio,
        city,
        spanishAudio
      );
      return {
        scene_number: item.num,
        day_label: item.day,
        theme_key: item.theme,
        spanish_description: item.desc,
        narration: item.narration,
        image_prompt: prompts.imagePrompt,
        video_prompt: prompts.videoPrompt
      };
    });
  };

  const [scenes, setScenes] = useState<SceneItem[]>(() =>
    generateInitialScenes(assetTokens, aspectRatio, targetCity, forceSpanishAudio)
  );

  // Recalcular lote completo
  const handleRegenerateBatch = () => {
    const updated = generateInitialScenes(assetTokens, aspectRatio, targetCity, forceSpanishAudio);
    setScenes(updated);
    setEditingSceneIdx(null);
  };

  // Re-compilar prompts de una escena individual tras editar en español
  const handleCompileSingleScene = (idx: number) => {
    const scene = scenes[idx];
    const prompts = buildPromptsForScene(
      scene.scene_number,
      scene.theme_key || `Escena ${scene.scene_number}`,
      scene.spanish_description,
      scene.narration,
      assetTokens,
      aspectRatio,
      targetCity,
      forceSpanishAudio
    );
    const updated = [...scenes];
    updated[idx] = {
      ...scene,
      image_prompt: prompts.imagePrompt,
      video_prompt: prompts.videoPrompt
    };
    setScenes(updated);
  };

  // Añadir nueva escena manual
  const handleAddScene = () => {
    const nextNum = scenes.length + 1;
    const desc = `Escena personalizada número ${nextNum} en ${targetCity}.`;
    const narration = `Texto de locución personalizado para la escena ${nextNum}.`;
    const prompts = buildPromptsForScene(
      nextNum,
      `Escena ${nextNum}`,
      desc,
      narration,
      assetTokens,
      aspectRatio,
      targetCity,
      forceSpanishAudio
    );
    const newScene: SceneItem = {
      scene_number: nextNum,
      day_label: `Día ${nextNum}`,
      theme_key: "Nueva Escena",
      spanish_description: desc,
      narration: narration,
      image_prompt: prompts.imagePrompt,
      video_prompt: prompts.videoPrompt
    };
    setScenes([...scenes, newScene]);
    setSelectedSceneNumber(nextNum);
  };

  // Eliminar escena
  const handleDeleteScene = (idxToDelete: number) => {
    const filtered = scenes.filter((_, idx) => idx !== idxToDelete).map((s, idx) => ({
      ...s,
      scene_number: idx + 1
    }));
    setScenes(filtered);
    if (editingSceneIdx === idxToDelete) setEditingSceneIdx(null);
  };

  // Actualizar campo de escena
  const handleUpdateSceneField = (idx: number, field: keyof SceneItem, value: string | number) => {
    const updated = [...scenes];
    updated[idx] = { ...updated[idx], [field]: value };
    setScenes(updated);
  };

  // Descargar script.json limpio para Flow / Extension
  const handleDownloadScriptJson = () => {
    const exportData = {
      scenes: scenes.map((s) => ({
        scene_number: s.scene_number,
        image_prompt: s.image_prompt,
        video_prompt: s.video_prompt,
        narration: s.narration
      }))
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

  // Copiar prompt individual
  const handleCopyPrompt = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  // Filtrado de escenas por día
  const filteredScenes = selectedDayFilter === "TODOS"
    ? scenes
    : scenes.filter((s) => s.day_label === selectedDayFilter);

  const currentIndividualScene = scenes.find((s) => s.scene_number === selectedSceneNumber) || scenes[0];
  const currentIndividualIdx = scenes.findIndex((s) => s.scene_number === currentIndividualScene.scene_number);

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
      {/* ── Header Principal ── */}
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
                    Flow Multimodal v2.5
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Generación de spots con tokens <code className="text-[#D4AF37]">@</code> para Google Labs Flow / Veo 2, edición bilingüe y exportación en lote.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowGoldenSample(!showGoldenSample)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                showGoldenSample
                  ? "bg-purple-950/70 text-purple-300 border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]"
                  : "bg-[#111622] hover:bg-[#1A2234] text-slate-300 border-slate-700"
              }`}
            >
              <Play className="w-3.5 h-3.5 text-purple-400" />
              <span>{showGoldenSample ? "Ocultar Muestra" : "Ver Video Muestra (VLC)"}</span>
            </button>

            <button
              onClick={() => setIsAssetDrawerOpen(!isAssetDrawerOpen)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                isAssetDrawerOpen
                  ? "bg-[#D4AF37] text-slate-950 border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                  : "bg-[#111622] hover:bg-[#1A2234] text-[#F3E5AB] border-slate-700 hover:border-[#D4AF37]/50"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Tokens @ Flow (5 Slots)</span>
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
              <span>{downloadSuccess ? "¡script.json Listo!" : "Descargar script.json"}</span>
            </button>
          </div>
        </div>

        {/* ── Subtabs de Navegación ── */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-800/80">
          {[
            { id: "generator", label: "🎬 Consola de Prompts (@ Flow)", icon: Sparkles },
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

      {/* ── MODAL / BANNER DE VIDEO MUESTRA OFICIAL (Golden Sample) ── */}
      {showGoldenSample && (
        <div className="bg-[#0B0D12] border-2 border-purple-500/40 rounded-2xl p-5 shadow-2xl animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Film className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="text-sm font-black text-white">Video de Referencia Oficial (Golden Sample)</h3>
                <p className="text-[11px] text-slate-400">
                  Generado con <code>HRP Modelo WARA 02.jpeg</code> + <code>logo.a.png</code> + <code>ático SCZ 01.jpg</code> en Google Labs Flow.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowGoldenSample(false)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 bg-slate-900 rounded-lg cursor-pointer"
            >
              Cerrar
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="md:col-span-1 flex justify-center bg-slate-950 p-2 rounded-2xl border border-slate-800">
              <video
                src="/video_prueba.1.mp4"
                controls
                autoPlay
                className="rounded-xl max-h-96 w-auto shadow-2xl"
              />
            </div>

            <div className="md:col-span-2 space-y-3 text-xs text-slate-300">
              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1.5">
                <span className="text-[10px] font-bold text-[#D4AF37] uppercase">Tokens Utilizados en esta Generación:</span>
                <div className="flex flex-wrap gap-2 text-[11px] font-mono">
                  <span className="bg-slate-950 px-2 py-1 rounded text-purple-300 border border-purple-500/30">
                    @HRP Modelo WARA 02.jpeg
                  </span>
                  <span className="bg-slate-950 px-2 py-1 rounded text-amber-300 border border-amber-500/30">
                    @logo.a.png
                  </span>
                  <span className="bg-slate-950 px-2 py-1 rounded text-emerald-300 border border-emerald-500/30">
                    @ático SCZ 01.jpg
                  </span>
                </div>
              </div>

              <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[10px] font-bold text-emerald-400 uppercase">Transcripción & Locución (00:10):</span>
                <p className="italic text-slate-200">
                  "Hola. Te presento a Sofía IA. Ella califica tus leads. Usa la metodología BANT. Así optimizas tu tiempo real. Agenda una demostración hoy."
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DRAWER DE CONFIGURACIÓN DE 5 TOKENS DE ASSETS (@) ── */}
      {isAssetDrawerOpen && (
        <div className="bg-[#111622] border-2 border-[#D4AF37]/60 rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-[#D4AF37]" />
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider">
                  Configuración de Assets Multimodales en Google Labs Flow
                </h3>
                <p className="text-[11px] text-slate-400">
                  Nombres exactos de los archivos subidos a Flow. Se inyectarán automáticamente como <code className="text-[#D4AF37]">@nombre_archivo</code>.
                </p>
              </div>
            </div>
            <button
              onClick={handleRegenerateBatch}
              className="px-3 py-1.5 bg-[#D4AF37] hover:bg-[#C29D2D] text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Aplicar a Todos los Prompts</span>
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
              <p className="text-[10px] text-slate-500">Hoja de referencia facial y vestimenta del asesor/a.</p>
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
              <p className="text-[10px] text-slate-500">Activa si la escena incluye interacción entre 2 personas.</p>
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
              <p className="text-[10px] text-slate-500">Isotipo 3D o logotipo de la inmobiliaria/Property OS.</p>
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
              <p className="text-[10px] text-slate-500">Foto o render del set, balcón, living o sala de reuniones.</p>
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
              <p className="text-[10px] text-slate-500">Captura de pantalla de la app, cotizador o semáforo legal.</p>
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
              <p className="text-[10px] text-slate-500">Banner o infografía con precio y condiciones comerciales.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── SUBTAB 1: CONSOLA DE PROMPTS (@ FLOW) ── */}
      {activeSubTab === "generator" && (
        <div className="space-y-4">
          {/* Barra de Control de Modalidad: Individual vs Lote */}
          <div className="bg-[#111622] border border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-400">Modo de Trabajo:</span>
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  onClick={() => setActiveMode("individual")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    activeMode === "individual"
                      ? "bg-[#D4AF37] text-slate-950 shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Modo Individual (1 a 1)</span>
                </button>
                <button
                  onClick={() => setActiveMode("batch")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    activeMode === "batch"
                      ? "bg-[#D4AF37] text-slate-950 shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Modo Lote (7 Días)</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Selector de Ratio */}
              <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => {
                    setAspectRatio("9:16");
                    setScenes((prev) =>
                      prev.map((s) => ({
                        ...s,
                        image_prompt: s.image_prompt.replace(/16:9/g, "9:16"),
                        video_prompt: s.video_prompt.replace(/16:9/g, "9:16"),
                      }))
                    );
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    aspectRatio === "9:16" ? "bg-[#D4AF37]/20 text-[#F3E5AB] border border-[#D4AF37]/40" : "text-slate-400"
                  }`}
                >
                  9:16 Vertical
                </button>
                <button
                  onClick={() => {
                    setAspectRatio("16:9");
                    setScenes((prev) =>
                      prev.map((s) => ({
                        ...s,
                        image_prompt: s.image_prompt.replace(/9:16/g, "16:9"),
                        video_prompt: s.video_prompt.replace(/9:16/g, "16:9"),
                      }))
                    );
                  }}
                  className={`px-2.5 py-1 rounded-lg font-bold transition ${
                    aspectRatio === "16:9" ? "bg-[#D4AF37]/20 text-[#F3E5AB] border border-[#D4AF37]/40" : "text-slate-400"
                  }`}
                >
                  16:9 Web
                </button>
              </div>

              {/* Selector de Ciudad */}
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

              {/* Forzar Audio en Español */}
              <button
                onClick={() => setForceSpanishAudio(!forceSpanishAudio)}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold border transition flex items-center gap-1 cursor-pointer ${
                  forceSpanishAudio
                    ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                    : "bg-slate-950 border-slate-800 text-slate-400"
                }`}
                title="Inyectar directivas de locución en español"
              >
                <Volume2 className="w-3.5 h-3.5" />
                <span>{forceSpanishAudio ? "Audio ES: ON" : "Audio ES: OFF"}</span>
              </button>
            </div>
          </div>

          {/* VISTA 1: MODO INDIVIDUAL (Enfoque Escena a Escena con Traducción Bilingüe) */}
          {activeMode === "individual" && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Barra Lateral de Selección de Escena */}
              <div className="lg:col-span-1 space-y-3">
                <div className="bg-[#111622] border border-slate-800 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-white uppercase">Escenas del Lote</span>
                    <button
                      onClick={handleAddScene}
                      className="text-[11px] font-bold text-[#D4AF37] hover:underline flex items-center gap-0.5 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" /> Añadir
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {scenes.map((s) => (
                      <button
                        key={s.scene_number}
                        onClick={() => setSelectedSceneNumber(s.scene_number)}
                        className={`w-full text-left p-2.5 rounded-xl text-xs font-bold transition flex items-center justify-between cursor-pointer border ${
                          selectedSceneNumber === s.scene_number
                            ? "bg-[#D4AF37]/15 border-[#D4AF37]/40 text-[#F3E5AB]"
                            : "bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <span className="w-5 h-5 rounded-md bg-slate-950 text-[#D4AF37] flex items-center justify-center text-[10px]">
                            {s.scene_number}
                          </span>
                          <span className="truncate">{s.day_label || `Escena ${s.scene_number}`}: {s.theme_key}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Editor Bilingüe y Consola de la Escena Seleccionada */}
              <div className="lg:col-span-3 space-y-4">
                <div className="bg-[#111622] border border-slate-800 rounded-2xl p-5 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span className="w-7 h-7 rounded-xl bg-[#D4AF37]/20 border border-[#D4AF37]/40 text-[#F3E5AB] font-black text-sm flex items-center justify-center">
                        {currentIndividualScene.scene_number}
                      </span>
                      <div>
                        <h3 className="text-sm font-black text-white">
                          {currentIndividualScene.day_label} — {currentIndividualScene.theme_key}
                        </h3>
                        <p className="text-[11px] text-slate-400">Edición en español y compilación con tokens de Flow.</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCompileSingleScene(currentIndividualIdx)}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-[#D4AF37] to-[#B89628] hover:brightness-110 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
                    >
                      <Languages className="w-3.5 h-3.5" />
                      <span>Traducir y Compilar Prompt Flow</span>
                    </button>
                  </div>

                  {/* Panel Izquierdo/Derecho: Español vs Inglés Flow */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {/* Bloque 1: Edición en Español */}
                    <div className="space-y-3 bg-slate-950/80 p-4 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] font-bold text-[#F3E5AB] uppercase flex items-center gap-1">
                        <MessageSquare className="w-3.5 h-3.5 text-[#D4AF37]" />
                        1. Redacción en Español (Acción & Locución)
                      </span>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">Descripción de la Escena:</label>
                        <textarea
                          value={currentIndividualScene.spanish_description}
                          onChange={(e) => handleUpdateSceneField(currentIndividualIdx, "spanish_description", e.target.value)}
                          rows={2}
                          className="w-full bg-slate-900 text-slate-200 p-2 rounded-lg text-xs outline-none border border-slate-700 focus:border-[#D4AF37]"
                        />
                      </div>

                      <div>
                        <label className="text-[10px] font-bold text-slate-400 block mb-1">Guión de Locución / Narration (Español):</label>
                        <textarea
                          value={currentIndividualScene.narration}
                          onChange={(e) => handleUpdateSceneField(currentIndividualIdx, "narration", e.target.value)}
                          rows={4}
                          className="w-full bg-slate-900 text-slate-200 p-2 rounded-lg text-xs italic outline-none border border-slate-700 focus:border-[#D4AF37]"
                        />
                      </div>
                    </div>

                    {/* Bloque 2: Prompt Cinematográfico Compilado para Flow (@) */}
                    <div className="space-y-3 bg-slate-950/80 p-4 rounded-xl border border-slate-800/80">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase flex items-center gap-1">
                          <Film className="w-3.5 h-3.5" />
                          2. Prompt de Video para Google Labs Flow
                        </span>
                        <button
                          onClick={() => handleCopyPrompt(currentIndividualScene.video_prompt, `ind_vid_${currentIndividualScene.scene_number}`)}
                          className="px-2.5 py-1 bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#F3E5AB] rounded-lg text-[11px] font-bold border border-[#D4AF37]/40 flex items-center gap-1 cursor-pointer transition"
                        >
                          {copiedIndex === `ind_vid_${currentIndividualScene.scene_number}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedIndex === `ind_vid_${currentIndividualScene.scene_number}` ? "¡Copiado!" : "Copiar para Flow"}</span>
                        </button>
                      </div>

                      <div className="p-3 bg-[#0B0D12] rounded-lg border border-slate-800 text-[11px] font-mono text-slate-300 max-h-40 overflow-y-auto leading-relaxed">
                        {currentIndividualScene.video_prompt}
                      </div>

                      {/* Prompt de Imagen / Start Frame */}
                      <div className="pt-2 border-t border-slate-900">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold text-[#D4AF37] uppercase">Start Frame / Imagen Fija:</span>
                          <button
                            onClick={() => handleCopyPrompt(currentIndividualScene.image_prompt, `ind_img_${currentIndividualScene.scene_number}`)}
                            className="text-[10px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                          >
                            {copiedIndex === `ind_img_${currentIndividualScene.scene_number}` ? <Check className="w-2.5 h-2.5 text-emerald-400" /> : <Copy className="w-2.5 h-2.5" />}
                            <span>Copiar Imagen</span>
                          </button>
                        </div>
                        <div className="p-2 bg-[#0B0D12] rounded-lg border border-slate-800 text-[10px] font-mono text-slate-400 line-clamp-2">
                          {currentIndividualScene.image_prompt}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* VISTA 2: MODO LOTE (BATCH MASTER 7 DÍAS) */}
          {activeMode === "batch" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-white flex items-center gap-2">
                  <Film className="w-4 h-4 text-[#D4AF37]" />
                  Lote Completo de Producción ({filteredScenes.length} Escenas en {aspectRatio})
                </h3>

                <button
                  onClick={handleDownloadScriptJson}
                  className="px-4 py-2 bg-[#D4AF37] hover:bg-[#C29D2D] text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>Exportar script.json Completo</span>
                </button>
              </div>

              <div className="space-y-3">
                {filteredScenes.map((scene, idx) => {
                  const isEditing = editingSceneIdx === idx;
                  return (
                    <div
                      key={scene.scene_number}
                      className={`bg-[#111622] border rounded-2xl p-4 transition-all space-y-3 ${
                        isEditing ? "border-[#D4AF37] shadow-lg shadow-[#D4AF37]/10" : "border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#F3E5AB] font-black text-xs flex items-center justify-center">
                            {scene.scene_number}
                          </span>
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-900 text-[#D4AF37] border border-slate-800">
                            {scene.day_label || `Escena ${scene.scene_number}`}
                          </span>
                          <h4 className="text-xs font-bold text-white">{scene.theme_key}</h4>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setEditingSceneIdx(isEditing ? null : idx)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-[11px] font-bold border border-slate-800 flex items-center gap-1 transition cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3 text-[#D4AF37]" />
                            <span>{isEditing ? "Listo" : "Editar"}</span>
                          </button>

                          <button
                            onClick={() => handleCopyPrompt(scene.video_prompt, `batch_vid_${idx}`)}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-[11px] font-bold border border-slate-800 flex items-center gap-1 transition cursor-pointer"
                            title="Copiar Video Prompt para Flow"
                          >
                            {copiedIndex === `batch_vid_${idx}` ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedIndex === `batch_vid_${idx}` ? "¡Copiado!" : "Copiar"}</span>
                          </button>

                          {scenes.length > 1 && (
                            <button
                              onClick={() => handleDeleteScene(idx)}
                              className="p-1.5 bg-slate-900 hover:bg-rose-950/60 text-slate-500 hover:text-rose-400 rounded-lg text-[11px] border border-slate-800 transition cursor-pointer"
                              title="Eliminar escena"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Prompts y Locución */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-900">
                          <span className="text-[10px] font-bold text-emerald-400 uppercase block mb-1">Prompt de Video (Tokens @ Flow):</span>
                          {isEditing ? (
                            <textarea
                              value={scene.video_prompt}
                              onChange={(e) => handleUpdateSceneField(idx, "video_prompt", e.target.value)}
                              rows={3}
                              className="w-full bg-slate-900 text-slate-200 p-2 rounded-lg text-xs font-mono outline-none border border-slate-700 focus:border-[#D4AF37]"
                            />
                          ) : (
                            <p className="text-slate-300 line-clamp-3 font-mono">{scene.video_prompt}</p>
                          )}
                        </div>

                        <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-900">
                          <span className="text-[10px] font-bold text-[#F3E5AB] uppercase block mb-1">Locución en Español:</span>
                          {isEditing ? (
                            <textarea
                              value={scene.narration}
                              onChange={(e) => handleUpdateSceneField(idx, "narration", e.target.value)}
                              rows={3}
                              className="w-full bg-slate-900 text-slate-200 p-2 rounded-lg text-xs italic outline-none border border-slate-700 focus:border-[#D4AF37]"
                            />
                          ) : (
                            <p className="text-slate-300 line-clamp-3 italic">"{scene.narration}"</p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
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
                Automatización de generación por lotes en Google Labs Flow y Vibes AI sin intervención manual.
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

          {/* Guía en 3 Pasos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-2">
              <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/15 text-[#F3E5AB] font-black text-sm flex items-center justify-center">
                1
              </div>
              <h4 className="text-xs font-bold text-white">Descarga script.json</h4>
              <p className="text-[11px] text-slate-400">
                Usa el botón superior para descargar el archivo <code className="text-[#D4AF37]">script.json</code> con tus tokens <code className="text-slate-300">@</code> configurados.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 font-black text-sm flex items-center justify-center">
                2
              </div>
              <h4 className="text-xs font-bold text-white">Selecciona Carpeta en Flow</h4>
              <p className="text-[11px] text-slate-400">
                Abre Google Labs Flow, presiona el icono de la extensión y selecciona la carpeta donde descargaste tu <code className="text-emerald-400">script.json</code>.
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

          <div className="bg-[#0B0D12] p-4 rounded-2xl border border-slate-800 flex items-start gap-3 text-xs text-slate-400">
            <ShieldCheck className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-200">Compatibilidad con Google Labs Flow & Veo 2</p>
              <p className="mt-0.5">
                Los prompts generados utilizan el sistema de anclaje de assets @ multimodales, garantizando cero morphing y retención de identidad facial en todo el lote semanal.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── SUBTAB 3: BIBLIOTECA DMO & RED DE AFILIADOS ── */}
      {activeSubTab === "dmo" && (
        <div className="bg-[#111622] border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Share2 className="w-5 h-5 text-[#D4AF37]" />
                Biblioteca de Acción Diaria (DMO) & Social Selling
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Packs de copys listos para que los asesores de tu red publiquen en Historias, Reels y TikTok con su enlace directo.
              </p>
            </div>

            {/* Inyector de Datos del Asesor */}
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
                <span>Enlace inyectado: <code>wa.me/{advisorPhone}?text=CALCULAR</code></span>
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
                <span>Enlace inyectado: <code>wa.me/{advisorPhone}?text=AUDITORIA</code></span>
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
