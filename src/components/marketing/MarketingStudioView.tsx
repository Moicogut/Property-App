import React, { useState, useEffect } from "react";
import {
  Clapperboard,
  Sparkles,
  Download,
  Copy,
  Check,
  Play,
  Film,
  Layers,
  Smartphone,
  Monitor,
  Share2,
  Bot,
  ShieldCheck,
  TrendingUp,
  FileCode,
  ExternalLink,
  MessageSquare,
  Zap,
  Globe,
  Sliders,
  CheckCircle2,
  Plus,
  Trash2,
  RotateCcw,
  Volume2,
  User,
  Image as ImageIcon,
  Building,
  Edit3
} from "lucide-react";
import type { AppUser, Lead } from "@/src/types/property";

interface MarketingStudioViewProps {
  currentUser: AppUser;
  leads?: Lead[];
}

export interface SceneItem {
  scene_number: number;
  day_label?: string;
  theme_key?: string;
  image_prompt: string;
  video_prompt: string;
  narration: string;
}

export const MarketingStudioView: React.FC<MarketingStudioViewProps> = ({ currentUser, leads = [] }) => {
  const [activeSubTab, setActiveSubTab] = useState<"generator" | "extension" | "dmo" | "telemetry">("generator");
  
  // ── Controles de Configuración General ──
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "16:9">("9:16");
  const [targetCity, setTargetCity] = useState<string>("Santa Cruz");
  const [selectedDayFilter, setSelectedDayFilter] = useState<string>("TODOS");
  const [forceSpanishAudio, setForceSpanishAudio] = useState<boolean>(true);

  // ── Hojas de Referencia (HR Model Sheets) Personalizables ──
  const [characterGender, setCharacterGender] = useState<"male" | "female">("male");
  const [characterStyle, setCharacterStyle] = useState<string>("Traje Obsidian Black con pin dorado");
  const [environmentType, setEnvironmentType] = useState<string>("Penthouse de Lujo con bokeh urbano");
  const [productDisplay, setProductDisplay] = useState<string>("Tablet de cristal con interfaz Property OS");
  const [isHrDrawerOpen, setIsHrDrawerOpen] = useState<boolean>(false);

  // ── Datos de Contacto de Red ──
  const [advisorName, setAdvisorName] = useState<string>(currentUser.fullName || "Asesor Property OS");
  const [advisorPhone, setAdvisorPhone] = useState<string>("59170000000");

  // ── Feedback UI ──
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [editingSceneIdx, setEditingSceneIdx] = useState<number | null>(null);

  // ── Generador Dinámico de Tokens según Hojas de Referencia ──
  const getCharacterToken = () => {
    if (characterGender === "male") {
      return "33-year-old professional latino male real estate advisor, short neat dark hair, wearing an impeccably tailored obsidian black suit with an open-collar ivory shirt and a subtle gold lapel pin, confident and trustworthy look";
    } else {
      return "30-year-old professional latina female real estate advisor, elegant dark brown hair, wearing a sleek tailored obsidian black blazer with ivory silk blouse and subtle champagne gold jewelry, charismatic and authoritative expression";
    }
  };

  const getEnvironmentToken = () => {
    switch (environmentType) {
      case "Departamento Modelo":
        return `bright sunny luxury model apartment in ${targetCity} with open-concept quartz kitchen, floor-to-ceiling panoramic glass windows and warm morning natural light`;
      case "Oficina Minimalista":
        return `high-tech minimalist real estate boardroom in ${targetCity} with dark graphite walls, architectural glass desks and accent edge lighting`;
      default:
        return `modern luxury executive penthouse in ${targetCity} with soft cinematic city bokeh at sunset, key light 5600K diffused, subtle 3200K champagne gold rim lighting`;
    }
  };

  const getProductToken = () => {
    switch (productDisplay) {
      case "Smartphone WhatsApp":
        return "modern smartphone illuminating showing automated WhatsApp assistant Sofia IA actively qualifying real estate BANT buyer appointments";
      case "Semáforo Legal":
        return "high-tech transparent holographic screen showing a green real estate legal audit shield with three verified checks for Folio Real, Taxes, and Cadastre";
      default:
        return "sleek glass tablet displaying a glowing interactive real estate mortgage amortization chart and property valuation heatmap";
    }
  };

  // ── Generación de Escenas por Defecto ──
  const generateInitialScenes = (ratio: "9:16" | "16:9", city: string, spanishAudio: boolean): SceneItem[] => {
    const charToken = getCharacterToken();
    const envToken = getEnvironmentToken();
    const prodToken = getProductToken();
    const audioToken = spanishAudio
      ? "Audio: Native clear neutral Latin American Spanish male voiceover speaking strictly in Spanish: "
      : "";

    return [
      {
        scene_number: 1,
        day_label: "Lunes",
        theme_key: "Crédito VIS & Cuotas ($285/mes)",
        image_prompt: `Cinematic vertical ${ratio === "9:16" ? "9:16 portrait" : "16:9"}, full ${ratio === "9:16" ? "1080x1920" : "1920x1080"}, ${charToken}, holding ${prodToken}, ${envToken}, 5600K diffused key lighting with champagne gold edge light, hyperrealistic 8k, aspect ratio ${ratio} --ar ${ratio}`,
        video_prompt: `Camera performs a slow cinematic push-in in ${ratio} towards the advisor as he smiles confidently and taps the glass tablet screen showing a 5.5 percent mortgage calculation, ${envToken}, smooth 24fps movement, 5600K lighting, ${audioToken}'Con el Crédito VIS compras tu departamento con cuota de 285 dólares al mes', aspect ratio ${ratio} --ar ${ratio}`,
        narration: `Si sigues creyendo que necesitas cincuenta mil dólares para comprar tu primer departamento en ${city}, estás perdiendo dinero. Con el Crédito de Vivienda Social VIS, la tasa de interés está fijada al 5.5% regulada por ley. Eso significa que por un departamento de 48,000 dólares, tu cuota mensual queda en solo 285 dólares... exactamente lo que hoy pagas de alquiler. Comenta la palabra CALCULAR abajo y te envío el simulador oficial a tu WhatsApp.`
      },
      {
        scene_number: 2,
        day_label: "Martes",
        theme_key: "Sofía IA Calificando a las 2:30 AM",
        image_prompt: `Cinematic vertical ${ratio === "9:16" ? "9:16 shot" : "16:9"}, full ${ratio === "9:16" ? "1080x1920" : "1920x1080"}, luxury modern office at 2:30 AM with dark ambient night aesthetic, glowing neon accents, ${charToken} sleeping peacefully in a leather chair while in the foreground a smartphone on the desk illuminates showing Sofia IA, photorealistic 8k, aspect ratio ${ratio} --ar ${ratio}`,
        video_prompt: `Slow camera pan in ${ratio} from the peaceful advisor to the glowing smartphone displaying incoming WhatsApp messages where Sofia IA automatically qualifies buyer budget and books visits in Google Calendar, 24fps, ${audioToken}'Son las dos y media de la madrugada y acabo de calificar a un comprador listo para firmar', aspect ratio ${ratio} --ar ${ratio}`,
        narration: `Son las dos y media de la madrugada y acabo de calificar a un comprador listo para firmar minuta. Mientras descansas, nuestra asistente Sofía IA atiende a tus clientes en WhatsApp, califica su presupuesto con telemetría BANT y te agenda la visita en Google Calendar. Comenta BOT para probar el simulador gratis.`
      },
      {
        scene_number: 3,
        day_label: "Miércoles",
        theme_key: "Semáforo Legal & Folio Real",
        image_prompt: `Cinematic vertical ${ratio === "9:16" ? "9:16 shot" : "16:9"}, full ${ratio === "9:16" ? "1080x1920" : "1920x1080"}, close-up of a transparent screen showing a green real estate legal audit shield with three verified checks for Folio Real, Municipal Taxes, and Approved Cadastre, ${charToken} standing behind with professional trustworthy look, 8k, aspect ratio ${ratio} --ar ${ratio}`,
        video_prompt: `Camera zooms slightly in ${ratio} into the digital legal audit interface as three green checkmarks light up in sequence for Folio Real, Taxes, and Cadastre while the advisor points with confidence, 24fps, ${audioToken}'Nunca des un centavo de reserva sin antes revisar este semáforo legal', aspect ratio ${ratio} --ar ${ratio}`,
        narration: `Nunca des un centavo de reserva por un inmueble sin antes revisar este semáforo legal. En Bolivia, 4 de cada 10 inmuebles tienen problemas en Derechos Reales: hipotecas no canceladas, deudas en el RUAT o planos no visados. En Property OS auditamos los 3 pilares legales antes de emitir cualquier contrato. Comenta AUDITORIA para evaluar tu caso.`
      },
      {
        scene_number: 4,
        day_label: "Jueves",
        theme_key: "Estudio ACM & Valuación de Inmuebles",
        image_prompt: `Cinematic vertical ${ratio === "9:16" ? "9:16 medium shot" : "16:9"}, full ${ratio === "9:16" ? "1080x1920" : "1920x1080"}, ${charToken} standing beside an architectural model of a modern apartment tower in ${city}, reviewing an analytical real estate valuation heatmap on a tablet, 8k, aspect ratio ${ratio} --ar ${ratio}`,
        video_prompt: `Gentle camera orbit in ${ratio} around the advisor as he examines the architectural scale model, comparing market square meter values on his tablet with smooth gestures, 24fps, ${audioToken}'Si tu casa lleva seis meses en venta y nadie llama este es el motivo exacto', aspect ratio ${ratio} --ar ${ratio}`,
        narration: `¿Tu casa lleva 6 meses en venta y nadie llama? Este es el motivo exacto: el precio por metro cuadrado está desalineado del mercado real. Con nuestro estudio comparativo ACM analizamos la zona exacta para que vendas al mejor valor sin quemar tu propiedad. Comenta PRECIO y valuamos tu inmueble.`
      },
      {
        scene_number: 5,
        day_label: "Viernes",
        theme_key: "Asesor Tradicional vs. Asesor con Property OS",
        image_prompt: `Cinematic vertical ${ratio === "9:16" ? "9:16 split screen" : "16:9"}, full ${ratio === "9:16" ? "1080x1920" : "1920x1080"}, on the left an exhausted agent buried under messy paper folders, on the right ${charToken} operating Property OS on a single lightweight laptop with automated CRM pipelines, 8k, aspect ratio ${ratio} --ar ${ratio}`,
        video_prompt: `Dynamic split comparison in ${ratio} transitioning into a full shot of the modern advisor effortlessly generating a digital PDF reservation contract with one click on Property OS, 24fps, ${audioToken}'El noventa por ciento de los agentes inmobiliarios perderá clientes este año por seguir en papel', aspect ratio ${ratio} --ar ${ratio}`,
        narration: `El 90% de los agentes inmobiliarios perderá clientes este año por seguir usando hojas de cálculo y notas en papel. Property OS es el sistema operativo completo con contratos en PDF, cotizador bancario y pipeline automatizado. Si quieres usar esta tecnología o unirte a nuestro equipo de embajadores, comenta SISTEMA.`
      },
      {
        scene_number: 6,
        day_label: "Sábado",
        theme_key: "Tour Departamento $65,000 en Zona Residencial",
        image_prompt: `Cinematic vertical ${ratio === "9:16" ? "9:16 wide shot" : "16:9"}, full ${ratio === "9:16" ? "1080x1920" : "1920x1080"}, beautiful bright modern living room in ${city} with floor-to-ceiling glass windows, sunny natural light illuminating an open-concept kitchen, ${charToken} gesturing welcomingly towards the balcony, 8k, aspect ratio ${ratio} --ar ${ratio}`,
        video_prompt: `Smooth forward tracking shot in ${ratio} walking into the luxurious 65,000-dollar apartment, showing the spacious living room, kitchen, and panoramic balcony view with soft sun flare, 24fps, ${audioToken}'Te muestro este departamento de sesenta y cinco mil dólares en la mejor zona', aspect ratio ${ratio} --ar ${ratio}`,
        narration: `Te muestro este departamento de 65,000 dólares en la mejor zona residencial de ${city}. Dos dormitorios, cocina equipada y balcón panorámico, apto para crédito VIS con cuota bancaria súper accesible. Comenta TOUR y te paso la ficha técnica completa con ubicación exacta.`
      },
      {
        scene_number: 7,
        day_label: "Domingo",
        theme_key: "DMO Social Selling & Objeciones",
        image_prompt: `Cinematic vertical ${ratio === "9:16" ? "9:16 portrait" : "16:9"}, full ${ratio === "9:16" ? "1080x1920" : "1920x1080"}, ${charToken} sitting comfortably in a modern leather armchair holding a coffee cup, looking genuinely into the camera with an engaging, approachable expression, warm ambient lighting, 8k, aspect ratio ${ratio} --ar ${ratio}`,
        video_prompt: `Close-up conversational camera angle in ${ratio} as the advisor addresses the audience directly with authentic micro-expressions and gestures, warm atmospheric lighting, 24fps, ${audioToken}'Cuál es tu mayor freno para comprar casa este año escríbeme y te asesoramos', aspect ratio ${ratio} --ar ${ratio}`,
        narration: `Muchas personas me preguntan cuál es el mayor freno para comprar casa este 2026: ¿el aporte inicial o el miedo a las tasas? La clave no es esperar el momento perfecto, sino estructurar tu financiamiento con datos reales. Escríbeme un mensaje directo con tu caso y te asesoramos paso a paso.`
      }
    ];
  };

  const [scenes, setScenes] = useState<SceneItem[]>(() =>
    generateInitialScenes(aspectRatio, targetCity, forceSpanishAudio)
  );

  // Recalcular escenas cuando cambian las configuraciones de HR o globales
  const handleRegenerateBatch = () => {
    const updated = generateInitialScenes(aspectRatio, targetCity, forceSpanishAudio);
    setScenes(updated);
    setEditingSceneIdx(null);
  };

  // Añadir nueva escena manual
  const handleAddScene = () => {
    const nextNum = scenes.length + 1;
    const newScene: SceneItem = {
      scene_number: nextNum,
      day_label: `Día ${nextNum}`,
      theme_key: "Nueva Escena Personalizada",
      image_prompt: `Cinematic vertical ${aspectRatio === "9:16" ? "9:16 portrait" : "16:9"}, full ${aspectRatio === "9:16" ? "1080x1920" : "1920x1080"}, ${getCharacterToken()}, ${getEnvironmentToken()}, 8k, aspect ratio ${aspectRatio} --ar ${aspectRatio}`,
      video_prompt: `Cinematic video in ${aspectRatio}, advisor presenting real estate property with natural movement, 24fps, ${forceSpanishAudio ? "Audio: Native clear neutral Latin American Spanish voiceover speaking in Spanish: '[Texto]', " : ""}aspect ratio ${aspectRatio} --ar ${aspectRatio}`,
      narration: `Texto de locución personalizado para la escena ${nextNum} en ${targetCity}.`
    };
    setScenes([...scenes, newScene]);
    setEditingSceneIdx(scenes.length);
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
  const handleUpdateSceneField = (idx: number, field: keyof SceneItem, value: any) => {
    const updated = [...scenes];
    updated[idx] = { ...updated[idx], [field]: value };
    setScenes(updated);
  };

  // Descargar script.json con estructura raíz {"scenes": [...]}
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
  const handleCopyPrompt = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2500);
  };

  // Filtrado de escenas por día
  const filteredScenes = selectedDayFilter === "TODOS"
    ? scenes
    : scenes.filter((s) => s.day_label === selectedDayFilter);

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
                    IA Batch v2.2
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Generación de spots por lotes para Google Labs Flow / Vibes AI, distribución en red y captura en DMs.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsHrDrawerOpen(!isHrDrawerOpen)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                isHrDrawerOpen
                  ? "bg-[#D4AF37] text-slate-950 border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.4)]"
                  : "bg-[#111622] hover:bg-[#1A2234] text-[#F3E5AB] border-slate-700 hover:border-[#D4AF37]/50"
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Hojas de Referencia (HR)</span>
            </button>

            <a
              href="https://labs.google/flow"
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-2 bg-[#111622] hover:bg-[#1A2234] border border-slate-700 hover:border-[#D4AF37]/50 text-[#F3E5AB] font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-xs"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span>Abrir Google Labs Flow</span>
            </a>

            <button
              onClick={handleDownloadScriptJson}
              className="px-4 py-2 bg-gradient-to-r from-[#D4AF37] to-[#B89628] hover:brightness-110 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-[0_0_15px_rgba(212,175,55,0.4)] transition-all cursor-pointer"
            >
              {downloadSuccess ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
              <span>{downloadSuccess ? "¡script.json Descargado!" : "Descargar script.json"}</span>
            </button>
          </div>
        </div>

        {/* ── Subtabs de Navegación ── */}
        <div className="flex flex-wrap gap-2 mt-6 pt-4 border-t border-slate-800/80">
          {[
            { id: "generator", label: "🎬 Generador de Scripts & Prompts", icon: Sparkles },
            { id: "extension", label: "🧩 Extensión Chrome Suite", icon: FileCode },
            { id: "dmo", label: "📱 Biblioteca DMO & Red de Afiliados", icon: Share2 },
            { id: "telemetry", label: "📊 Telemetría de DMs & Campañas", icon: TrendingUp },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
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

      {/* ── DRAWER INTERACTIVO: HOJAS DE REFERENCIA (HR MODEL SHEETS) ── */}
      {isHrDrawerOpen && (
        <div className="bg-[#111622] border-2 border-[#D4AF37]/60 rounded-2xl p-5 shadow-2xl space-y-4 animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-[#D4AF37]" />
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Hojas de Referencia Oficiales (HR Model Sheets)
              </h3>
            </div>
            <button
              onClick={handleRegenerateBatch}
              className="px-3 py-1.5 bg-[#D4AF37] hover:bg-[#C29D2D] text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Aplicar y Recalcular Prompts</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
            {/* 1. Personaje */}
            <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <label className="text-[10px] font-bold text-[#D4AF37] uppercase flex items-center gap-1">
                <User className="w-3 h-3" />
                HR-Personaje (Asesor)
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => setCharacterGender("male")}
                  className={`py-1.5 px-2 rounded-lg font-bold text-[11px] border transition cursor-pointer ${
                    characterGender === "male"
                      ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#F3E5AB]"
                      : "bg-slate-950 border-slate-800 text-slate-400"
                  }`}
                >
                  Hombre (33a)
                </button>
                <button
                  onClick={() => setCharacterGender("female")}
                  className={`py-1.5 px-2 rounded-lg font-bold text-[11px] border transition cursor-pointer ${
                    characterGender === "female"
                      ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#F3E5AB]"
                      : "bg-slate-950 border-slate-800 text-slate-400"
                  }`}
                >
                  Mujer (30a)
                </button>
              </div>
              <p className="text-[10px] text-slate-500 italic mt-1">
                Vestimenta: Traje entallado Obsidian Black (`#0B0D12`) y pin dorado (`#D4AF37`).
              </p>
            </div>

            {/* 2. Escenario */}
            <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <label className="text-[10px] font-bold text-emerald-400 uppercase flex items-center gap-1">
                <Building className="w-3 h-3" />
                HR-Escenario (Set)
              </label>
              <select
                value={environmentType}
                onChange={(e) => setEnvironmentType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200 outline-none focus:ring-1 focus:ring-[#D4AF37]"
              >
                <option value="Penthouse de Lujo">Penthouse de Lujo (5600K)</option>
                <option value="Departamento Modelo">Departamento Modelo (Luz Día)</option>
                <option value="Oficina Minimalista">Oficina Ejecutiva Minimalista</option>
              </select>
              <p className="text-[10px] text-slate-500 italic mt-1">
                Iluminación fija 5600K key light + 3200K rim light dorado en hombros.
              </p>
            </div>

            {/* 3. Producto / UI */}
            <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <label className="text-[10px] font-bold text-blue-400 uppercase flex items-center gap-1">
                <Smartphone className="w-3 h-3" />
                HR-Producto & UI
              </label>
              <select
                value={productDisplay}
                onChange={(e) => setProductDisplay(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-1.5 text-xs text-slate-200 outline-none focus:ring-1 focus:ring-[#D4AF37]"
              >
                <option value="Tablet con Property OS">Tablet con Cotizador VIS</option>
                <option value="Smartphone WhatsApp">Smartphone con Sofía IA</option>
                <option value="Semáforo Legal">Pantalla con Semáforo Legal</option>
              </select>
              <p className="text-[10px] text-slate-500 italic mt-1">
                Muestra la app en modo oscuro con acentos dorados y esmeraldas.
              </p>
            </div>

            {/* 4. Idioma de Audio Forzado */}
            <div className="bg-slate-900/90 p-3.5 rounded-xl border border-slate-800 space-y-2">
              <label className="text-[10px] font-bold text-[#F3E5AB] uppercase flex items-center gap-1">
                <Volume2 className="w-3 h-3 text-[#D4AF37]" />
                Audio & Idioma Forzado
              </label>
              <button
                onClick={() => setForceSpanishAudio(!forceSpanishAudio)}
                className={`w-full py-2 px-2.5 rounded-lg font-bold text-[11px] border transition flex items-center justify-between cursor-pointer ${
                  forceSpanishAudio
                    ? "bg-emerald-950/60 border-emerald-500/60 text-emerald-300"
                    : "bg-slate-950 border-slate-800 text-slate-400"
                }`}
              >
                <span>Voz en Español Neutro</span>
                <span>{forceSpanishAudio ? "✅ ACTIVO" : "⚪ OFF"}</span>
              </button>
              <p className="text-[10px] text-slate-500 italic mt-1">
                Inyecta directivas explícitas de locución en español para evitar voces en inglés.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── SUBTAB 1: Generador de Scripts & Prompts (AI Batch Generator) ── */}
      {activeSubTab === "generator" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Columna de Controles de Configuración */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-[#111622] border border-slate-800 rounded-2xl p-4 space-y-4">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#D4AF37]" />
                Filtros & Personalización
              </h3>

              {/* Selector de Día */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1.5">Filtrar por Día de Campaña</label>
                <select
                  value={selectedDayFilter}
                  onChange={(e) => setSelectedDayFilter(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 outline-none focus:ring-1 focus:ring-[#D4AF37]"
                >
                  <option value="TODOS">📅 Toda la Semana (7 Días Lote)</option>
                  <option value="Lunes">Lunes (Crédito VIS & Cuotas)</option>
                  <option value="Martes">Martes (Sofía IA 24/7)</option>
                  <option value="Miércoles">Miércoles (Semáforo Legal)</option>
                  <option value="Jueves">Jueves (Estudio ACM Precios)</option>
                  <option value="Viernes">Viernes (SaaS Asesores B2B)</option>
                  <option value="Sábado">Sábado (Tour Departamento)</option>
                  <option value="Domingo">Domingo (DMO & Objeciones)</option>
                </select>
              </div>

              {/* Relación de Aspecto */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1.5">Relación de Aspecto</label>
                <div className="grid grid-cols-2 gap-2">
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
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      aspectRatio === "9:16"
                        ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#F3E5AB]"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>9:16 Vertical</span>
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
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                      aspectRatio === "16:9"
                        ? "bg-[#D4AF37]/20 border-[#D4AF37] text-[#F3E5AB]"
                        : "bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>16:9 Web</span>
                  </button>
                </div>
              </div>

              {/* Ciudad Objetivo */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1.5">Ciudad de Campaña</label>
                <select
                  value={targetCity}
                  onChange={(e) => {
                    setTargetCity(e.target.value);
                  }}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 outline-none focus:ring-1 focus:ring-[#D4AF37]"
                >
                  <option value="Santa Cruz">📍 Santa Cruz (Equipetrol / Urubó)</option>
                  <option value="La Paz">📍 La Paz (Calacoto / Sopocachi)</option>
                  <option value="Cochabamba">📍 Cochabamba (Zona Norte)</option>
                  <option value="Bolivia">📍 Nacional (Bolivia)</option>
                </select>
              </div>

              {/* Botones de Acción de Escenas */}
              <div className="pt-2 border-t border-slate-800/80 space-y-2">
                <button
                  onClick={handleAddScene}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-[#D4AF37]/50 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-[#D4AF37]" />
                  <span>+ Añadir Escena al Lote</span>
                </button>

                <button
                  onClick={handleRegenerateBatch}
                  className="w-full py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Restablecer Guión de la Semana</span>
                </button>
              </div>

              {/* Botón de Descarga script.json */}
              <button
                onClick={handleDownloadScriptJson}
                className="w-full py-2.5 bg-[#D4AF37] hover:bg-[#C29D2D] text-slate-950 font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Descargar script.json ({aspectRatio})</span>
              </button>
            </div>
          </div>

          {/* Columna de Escenas y Prompts */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black text-white flex items-center gap-2">
                <Film className="w-4 h-4 text-[#D4AF37]" />
                Lote de Producción ({filteredScenes.length} Escenas en {aspectRatio})
              </h3>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Audio:</span>
                <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${forceSpanishAudio ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : "bg-slate-800 text-slate-400"}`}>
                  {forceSpanishAudio ? "Español Neutro Forzado" : "Estándar"}
                </span>
              </div>
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
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-slate-900 text-[#D4AF37] border border-slate-800">
                            {scene.day_label || `Escena ${scene.scene_number}`}
                          </span>
                          <h4 className="text-xs font-bold text-white">
                            {scene.theme_key || `Escena ${scene.scene_number}`}
                          </h4>
                        </div>
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
                          onClick={() => handleCopyPrompt(JSON.stringify(scene, null, 2), idx)}
                          className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-[11px] font-bold border border-slate-800 flex items-center gap-1 transition cursor-pointer"
                          title="Copiar JSON de esta escena"
                        >
                          {copiedIndex === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedIndex === idx ? "¡Copiado!" : "Copiar"}</span>
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

                    {/* Prompts Desglosados (Modo Lectura o Edición) */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                      <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-900">
                        <span className="text-[10px] font-bold text-[#D4AF37] uppercase block mb-1">Prompt de Imagen / Start Frame:</span>
                        {isEditing ? (
                          <textarea
                            value={scene.image_prompt}
                            onChange={(e) => handleUpdateSceneField(idx, "image_prompt", e.target.value)}
                            rows={3}
                            className="w-full bg-slate-900 text-slate-200 p-2 rounded-lg text-xs font-mono outline-none border border-slate-700 focus:border-[#D4AF37]"
                          />
                        ) : (
                          <p className="text-slate-300 line-clamp-3 font-mono">{scene.image_prompt}</p>
                        )}
                      </div>

                      <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-900">
                        <span className="text-[10px] font-bold text-emerald-400 uppercase block mb-1">Prompt de Video / Animación:</span>
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
                    </div>

                    {/* Guión de Locución */}
                    <div className="bg-[#0B0D12] p-2.5 rounded-xl border border-slate-800/80 space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-[#F3E5AB]">
                        <MessageSquare className="w-3 h-3" />
                        <span>Locución / Narration (Español):</span>
                      </div>
                      {isEditing ? (
                        <textarea
                          value={scene.narration}
                          onChange={(e) => handleUpdateSceneField(idx, "narration", e.target.value)}
                          rows={2}
                          className="w-full bg-slate-900 text-slate-200 p-2 rounded-lg text-xs italic outline-none border border-slate-700 focus:border-[#D4AF37]"
                        />
                      ) : (
                        <p className="text-[11px] text-slate-300 italic">"{scene.narration}"</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── SUBTAB 2: Extensión Chrome Suite (Property AI Content Generator) ── */}
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

          {/* Guía Visual en 3 Pasos */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-2">
              <div className="w-8 h-8 rounded-xl bg-[#D4AF37]/15 text-[#F3E5AB] font-black text-sm flex items-center justify-center">
                1
              </div>
              <h4 className="text-xs font-bold text-white">Descarga el Archivo script.json</h4>
              <p className="text-[11px] text-slate-400">
                Usa el botón superior para descargar el archivo <code className="text-[#D4AF37]">script.json</code> con la estructura exacta <code className="text-slate-300">&#123; "scenes": [...] &#125;</code>.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-400 font-black text-sm flex items-center justify-center">
                2
              </div>
              <h4 className="text-xs font-bold text-white">Selecciona la Carpeta en Chrome</h4>
              <p className="text-[11px] text-slate-400">
                Abre Google Labs Flow o Vibes AI, presiona el icono de la extensión y selecciona la carpeta donde guardaste tu archivo. Acepta el permiso de Chrome.
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl space-y-2">
              <div className="w-8 h-8 rounded-xl bg-blue-500/15 text-blue-400 font-black text-sm flex items-center justify-center">
                3
              </div>
              <h4 className="text-xs font-bold text-white">Inicia el Lote en Fondo</h4>
              <p className="text-[11px] text-slate-400">
                Presiona "Imágenes" o "Videos". La extensión inyectará los prompts automáticamente mientras trabajas en otras pestañas.
              </p>
            </div>
          </div>

          {/* Atribución y Licencia Comunitaria */}
          <div className="bg-[#0B0D12] p-4 rounded-2xl border border-slate-800 flex items-start gap-3 text-xs text-slate-400">
            <ShieldCheck className="w-5 h-5 text-[#D4AF37] shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-200">Reconocimiento y Licencia Open Source Comunitaria</p>
              <p className="mt-0.5">
                Esta suite integra y adapta el motor de automatización desarrollado por la comunidad en{" "}
                <a
                  href="https://github.com/hans1801/AI-Content-Automation-Engine"
                  target="_blank"
                  rel="noreferrer"
                  className="text-[#D4AF37] underline font-medium hover:text-[#F3E5AB]"
                >
                  hans1801/AI-Content-Automation-Engine
                </a>{" "}
                bajo licencia abierta, incorporando los tokens visuales inmutables y la lógica multi-tenant de Property OS.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── SUBTAB 3: Biblioteca DMO & Red de Afiliados ── */}
      {activeSubTab === "dmo" && (
        <div className="bg-[#111622] border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Share2 className="w-5 h-5 text-[#D4AF37]" />
                Biblioteca de Acción Diaria (DMO) & Social Selling
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Packs de contenido listos para que los asesores de tu red publiquen en sus historias y reels con su enlace de referido.
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

          {/* Tarjetas de Copys DMO */}
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
                  onClick={() => handleCopyPrompt(`¿Sabías que por ley puedes financiar tu departamento al 5.5% fijo y pagar menos de cuota que lo que pagas hoy de alquiler? 🏠 Comenta CALCULAR o escríbeme a https://wa.me/${advisorPhone}?text=CALCULAR y te paso el simulador bancario en 5 segundos 👇`, 101)}
                  className="px-2.5 py-1 bg-[#D4AF37]/15 text-[#F3E5AB] font-bold rounded-lg text-xs hover:bg-[#D4AF37]/30 transition"
                >
                  {copiedIndex === 101 ? "¡Copiado!" : "Copiar Pack"}
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
                  onClick={() => handleCopyPrompt(`Antes de dar un centavo de reserva por una propiedad, exige el Semáforo Legal de Folio Real y Catastro. 🛡️ Nosotros auditamos la documentación antes de firmar cualquier minuta. Escríbeme AUDITORIA a https://wa.me/${advisorPhone}?text=AUDITORIA para evaluar tu caso.`, 102)}
                  className="px-2.5 py-1 bg-[#D4AF37]/15 text-[#F3E5AB] font-bold rounded-lg text-xs hover:bg-[#D4AF37]/30 transition"
                >
                  {copiedIndex === 102 ? "¡Copiado!" : "Copiar Pack"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── SUBTAB 4: Telemetría de DMs & Campañas ── */}
      {activeSubTab === "telemetry" && (
        <div className="space-y-6">
          {/* Contadores de Leads por Palabra Clave */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { keyword: "CALCULAR / VIS", count: keywordStats.CALCULAR, label: "Simuladores Entregados", color: "emerald" },
              { keyword: "BOT / SISTEMA", count: keywordStats.BOT, label: "Demos de Sofía IA", color: "blue" },
              { keyword: "AUDITORIA", count: keywordStats.AUDITORIA, label: "Consultas Legales", color: "amber" },
              { keyword: "PRECIO", count: keywordStats.PRECIO, label: "Captaciones de Inmuebles", color: "purple" },
              { keyword: "TOUR", count: keywordStats.TOUR, label: "Visitas Agendadas", color: "rose" },
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

          {/* Configuración de Webhook Activo */}
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
                  Captura automática de leads con aislamiento por <code>organization_id</code> y <code>sponsor_id</code>.
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
                  Árboles de decisión listos para importar en ManyChat o Meta Business Suite.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
