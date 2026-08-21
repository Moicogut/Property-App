import React, { useState } from "react";
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
  CheckCircle2
} from "lucide-react";
import type { AppUser, Lead } from "@/src/types/property";

interface MarketingStudioViewProps {
  currentUser: AppUser;
  leads?: Lead[];
}

interface SceneItem {
  scene_number: number;
  image_prompt: string;
  video_prompt: string;
  narration: string;
}

export const MarketingStudioView: React.FC<MarketingStudioViewProps> = ({ currentUser, leads = [] }) => {
  const [activeSubTab, setActiveSubTab] = useState<"generator" | "extension" | "dmo" | "telemetry">("generator");
  const [campaignType, setCampaignType] = useState<"VIS" | "CAPTACION" | "BOT_SAAS" | "LEGAL_AUDIT" | "TOUR" | "WEEK_PACK">("WEEK_PACK");
  const [aspectRatio, setAspectRatio] = useState<"9:16" | "16:9">("9:16");
  const [targetCity, setTargetCity] = useState<string>("Santa Cruz");
  const [advisorName, setAdvisorName] = useState<string>(currentUser.fullName || "Asesor Property OS");
  const [advisorPhone, setAdvisorPhone] = useState<string>("59170000000");
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Lote Maestro de 7 Escenas Oficiales
  const [scenes, setScenes] = useState<SceneItem[]>([
    {
      scene_number: 1,
      image_prompt: `Cinematic ${aspectRatio === "9:16" ? "vertical 9:16 portrait" : "horizontal 16:9"}, a sharp 33-year-old latino male real estate advisor with neat short dark hair, wearing an impeccably tailored obsidian black suit, ivory shirt and a subtle gold lapel pin, holding a sleek glass tablet displaying a glowing real estate mortgage chart, modern penthouse background in ${targetCity} with warm city bokeh, 5600K diffused key lighting with champagne gold edge light, hyperrealistic 8k, aspect ratio ${aspectRatio} --ar ${aspectRatio}`,
      video_prompt: `Camera performs a slow cinematic push-in in ${aspectRatio} towards the 33-year-old advisor in tailored black suit as he smiles confidently and taps the glass tablet screen showing a 5.5 percent mortgage calculation, luxury penthouse office background, smooth 24fps movement, 5600K lighting, aspect ratio ${aspectRatio} --ar ${aspectRatio}`,
      narration: `Si sigues creyendo que necesitas cincuenta mil dólares para comprar tu primer departamento en ${targetCity}, estás perdiendo dinero. Con el Crédito de Vivienda Social VIS, la tasa de interés está fijada al 5.5% regulada por ley. Eso significa que por un departamento de 48,000 dólares, tu cuota mensual queda en solo 285 dólares... exactamente lo que hoy pagas de alquiler. Comenta la palabra CALCULAR abajo y te envío el simulador oficial a tu WhatsApp.`
    },
    {
      scene_number: 2,
      image_prompt: `Cinematic ${aspectRatio === "9:16" ? "vertical 9:16 shot" : "horizontal 16:9"}, luxury modern office at 2:30 AM with dark ambient night aesthetic, glowing neon accents, 33-year-old advisor sleeping peacefully in a leather chair while in the foreground a smartphone on the desk illuminates showing an automated WhatsApp AI assistant Sofia closing a real estate appointment, photorealistic, 8k resolution, aspect ratio ${aspectRatio} --ar ${aspectRatio}`,
      video_prompt: `Slow camera pan in ${aspectRatio} from the peaceful advisor in suit to the glowing smartphone on the desk, displaying incoming WhatsApp messages where Sofia AI automatically qualifies the buyer's budget and books a visit in Google Calendar, cinematic lighting, 24fps, aspect ratio ${aspectRatio} --ar ${aspectRatio}`,
      narration: `Son las dos y media de la madrugada y acabo de calificar a un comprador listo para firmar minuta. Mientras descansas, nuestra asistente Sofía IA atiende a tus clientes en WhatsApp, califica su presupuesto con telemetría BANT y te agenda la visita en Google Calendar. Comenta BOT para probar el simulador gratis.`
    },
    {
      scene_number: 3,
      image_prompt: `Cinematic ${aspectRatio === "9:16" ? "vertical 9:16 shot" : "horizontal 16:9"}, close-up of a high-tech transparent screen showing a green real estate legal audit shield with three verified checks for Folio Real, Municipal Taxes, and Approved Cadastre, the 33-year-old male advisor in black suit standing behind with a professional trustworthy look, warm champagne gold lighting accents, 8k, aspect ratio ${aspectRatio} --ar ${aspectRatio}`,
      video_prompt: `Camera zooms slightly in ${aspectRatio} into the digital legal audit interface as three green verification checkmarks light up in sequence for Folio Real, Taxes, and Cadastre, while the advisor points to the screen with confidence, cinematic depth of field, 24fps, aspect ratio ${aspectRatio} --ar ${aspectRatio}`,
      narration: `Nunca des un centavo de reserva por un inmueble sin antes revisar este semáforo legal. En Bolivia, 4 de cada 10 inmuebles tienen problemas en Derechos Reales: hipotecas no canceladas, deudas en el RUAT o planos no visados. En Property OS auditamos los 3 pilares legales antes de emitir cualquier contrato. Comenta AUDITORIA para evaluar tu caso.`
    },
    {
      scene_number: 4,
      image_prompt: `Cinematic ${aspectRatio === "9:16" ? "vertical 9:16 medium shot" : "horizontal 16:9"}, 33-year-old real estate advisor standing beside an architectural model of a modern apartment tower in ${targetCity}, reviewing an analytical real estate valuation heatmap on a tablet, elegant obsidian interior design with gold highlights, 8k, aspect ratio ${aspectRatio} --ar ${aspectRatio}`,
      video_prompt: `Gentle camera orbit in ${aspectRatio} around the advisor as he examines the architectural scale model, comparing market square meter values on his tablet with smooth gestures, modern luxury aesthetic, 24fps, aspect ratio ${aspectRatio} --ar ${aspectRatio}`,
      narration: `¿Tu casa lleva 6 meses en venta y nadie llama? Este es el motivo exacto: el precio por metro cuadrado está desalineado del mercado real. Con nuestro estudio comparativo ACM analizamos la zona exacta para que vendas al mejor valor sin quemar tu propiedad. Comenta PRECIO y valuamos tu inmueble.`
    },
    {
      scene_number: 5,
      image_prompt: `Cinematic ${aspectRatio === "9:16" ? "vertical 9:16 split screen concept" : "horizontal 16:9"}, on the left an exhausted real estate agent buried under messy paper folders, on the right the sharp 33-year-old advisor in black suit operating Property OS on a single lightweight laptop with automated CRM pipelines, high contrast lighting, 8k, aspect ratio ${aspectRatio} --ar ${aspectRatio}`,
      video_prompt: `Dynamic split comparison in ${aspectRatio} transitioning into a full shot of the modern advisor effortlessly generating a digital PDF reservation contract with one click on Property OS, sleek UI glow, cinematic 24fps, aspect ratio ${aspectRatio} --ar ${aspectRatio}`,
      narration: `El 90% de los agentes inmobiliarios perderá clientes este año por seguir usando hojas de cálculo y notas en papel. Property OS es el sistema operativo completo con contratos en PDF, cotizador bancario y pipeline automatizado. Si quieres usar esta tecnología o unirte a nuestro equipo de embajadores, comenta SISTEMA.`
    },
    {
      scene_number: 6,
      image_prompt: `Cinematic ${aspectRatio === "9:16" ? "vertical 9:16 wide shot" : "horizontal 16:9"}, beautiful bright modern living room in ${targetCity} with floor-to-ceiling glass windows, sunny natural light illuminating an open-concept kitchen with quartz countertops, the 33-year-old male advisor in black suit gesturing welcomingly towards the balcony, architectural photography quality, 8k, aspect ratio ${aspectRatio} --ar ${aspectRatio}`,
      video_prompt: `Smooth forward tracking shot in ${aspectRatio} walking into the luxurious 65,000-dollar apartment, showing the spacious living room, modern kitchen, and panoramic balcony view with soft sun flare, 24fps, aspect ratio ${aspectRatio} --ar ${aspectRatio}`,
      narration: `Te muestro este departamento de 65,000 dólares en la mejor zona residencial de ${targetCity}. Dos dormitorios, cocina equipada y balcón panorámico, apto para crédito VIS con cuota bancaria súper accesible. Comenta TOUR y te paso la ficha técnica completa con ubicación exacta.`
    },
    {
      scene_number: 7,
      image_prompt: `Cinematic ${aspectRatio === "9:16" ? "vertical 9:16 portrait" : "horizontal 16:9"}, the 33-year-old advisor sitting comfortably in a modern leather armchair holding a coffee cup, looking genuinely into the camera with an engaging, approachable expression, warm ambient lighting in a premium executive lounge, 8k, aspect ratio ${aspectRatio} --ar ${aspectRatio}`,
      video_prompt: `Close-up conversational camera angle in ${aspectRatio} as the advisor addresses the audience directly with authentic micro-expressions and gestures, warm atmospheric lighting, 24fps, aspect ratio ${aspectRatio} --ar ${aspectRatio}`,
      narration: `Muchas personas me preguntan cuál es el mayor freno para comprar casa este 2026: ¿el aporte inicial o el miedo a las tasas? La clave no es esperar el momento perfecto, sino estructurar tu financiamiento con datos reales. Escríbeme un mensaje directo con tu caso y te asesoramos paso a paso.`
    }
  ]);

  // Actualizar prompts al cambiar ratio o ciudad
  const handleConfigChange = (newRatio: "9:16" | "16:9", newCity: string) => {
    setAspectRatio(newRatio);
    setTargetCity(newCity);
    setScenes((prev) =>
      prev.map((s) => ({
        ...s,
        image_prompt: s.image_prompt.replace(/9:16|16:9/g, newRatio),
        video_prompt: s.video_prompt.replace(/9:16|16:9/g, newRatio),
      }))
    );
  };

  // Descarga instantánea de script.json
  const handleDownloadScriptJson = () => {
    const dataObj = { scenes };
    const jsonStr = JSON.stringify(dataObj, null, 2);
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
                    IA Batch v2.0
                  </span>
                </h1>
                <p className="text-xs text-slate-400 mt-0.5">
                  Generación de spots por lotes para Google Labs Flow / Vibes AI, distribución en red y captura en DMs.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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

      {/* ── SUBTAB 1: Generador de Scripts & Prompts (AI Batch Generator) ── */}
      {activeSubTab === "generator" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Columna de Controles de Configuración */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-[#111622] border border-slate-800 rounded-2xl p-4 space-y-4">
              <h3 className="text-xs font-black text-white uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-[#D4AF37]" />
                Parámetros de Producción
              </h3>

              {/* Relación de Aspecto */}
              <div>
                <label className="text-[11px] font-bold text-slate-400 block mb-1.5">Relación de Aspecto</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleConfigChange("9:16", targetCity)}
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
                    onClick={() => handleConfigChange("16:9", targetCity)}
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
                  onChange={(e) => handleConfigChange(aspectRatio, e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-slate-200 outline-none focus:ring-1 focus:ring-[#D4AF37]"
                >
                  <option value="Santa Cruz">📍 Santa Cruz (Equipetrol / Urubó)</option>
                  <option value="La Paz">📍 La Paz (Calacoto / Sopocachi)</option>
                  <option value="Cochabamba">📍 Cochabamba (Zona Norte)</option>
                  <option value="Bolivia">📍 Nacional (Bolivia)</option>
                </select>
              </div>

              {/* Motor Generativo Compatible */}
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-[10px] font-bold text-slate-500 uppercase block mb-2">Compatibilidad Validada:</span>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-300 bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-800">
                    <span className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Google Labs Flow / Veo 2
                    </span>
                    <span className="text-[10px] font-mono text-[#D4AF37]">Batch OK</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-300 bg-slate-900/60 px-2.5 py-1.5 rounded-lg border border-slate-800">
                    <span className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Vibes AI (Batch 9:16)
                    </span>
                    <span className="text-[10px] font-mono text-[#D4AF37]">Batch OK</span>
                  </div>
                </div>
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
                Lote de Producción Semanal ({scenes.length} Escenas / {aspectRatio})
              </h3>
              <span className="text-xs text-slate-400">
                Formato estructurado con tokens de anclaje inmutable (Obsidian Black & Champagne Gold)
              </span>
            </div>

            <div className="space-y-3">
              {scenes.map((scene, idx) => (
                <div
                  key={scene.scene_number}
                  className="bg-[#111622] border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all space-y-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#F3E5AB] font-black text-xs flex items-center justify-center">
                        {scene.scene_number}
                      </span>
                      <h4 className="text-xs font-bold text-white">
                        {idx === 0 && "Lunes: Crédito VIS & Cuotas ($285/mes) [CALCULAR]"}
                        {idx === 1 && "Martes: Sofía IA Calificando a las 2:30 AM [BOT]"}
                        {idx === 2 && "Miércoles: Semáforo Legal (Folio Real & Impuestos) [AUDITORIA]"}
                        {idx === 3 && "Jueves: Estudio ACM & Valuación de Inmuebles [PRECIO]"}
                        {idx === 4 && "Viernes: Asesor Tradicional vs. Asesor con Property OS [SISTEMA]"}
                        {idx === 5 && "Sábado: Tour Departamento $65,000 en Zona Residencial [TOUR]"}
                        {idx === 6 && "Domingo: DMO Social Selling & Manejo de Objeciones"}
                      </h4>
                    </div>

                    <button
                      onClick={() => handleCopyPrompt(JSON.stringify(scene, null, 2), idx)}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-[11px] font-bold border border-slate-800 flex items-center gap-1 transition cursor-pointer"
                      title="Copiar JSON de esta escena"
                    >
                      {copiedIndex === idx ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedIndex === idx ? "¡Copiado!" : "Copiar"}</span>
                    </button>
                  </div>

                  {/* Prompts Desglosados */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-900">
                      <span className="text-[10px] font-bold text-[#D4AF37] uppercase block mb-1">Prompt de Imagen / Start Frame:</span>
                      <p className="text-slate-300 line-clamp-3 font-mono">{scene.image_prompt}</p>
                    </div>
                    <div className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-900">
                      <span className="text-[10px] font-bold text-emerald-400 uppercase block mb-1">Prompt de Video / Animación:</span>
                      <p className="text-slate-300 line-clamp-3 font-mono">{scene.video_prompt}</p>
                    </div>
                  </div>

                  {/* Guión de Locución */}
                  <div className="bg-[#0B0D12] p-2.5 rounded-xl border border-slate-800/80 flex items-start gap-2">
                    <MessageSquare className="w-3.5 h-3.5 text-[#F3E5AB] shrink-0 mt-0.5" />
                    <p className="text-[11px] text-slate-300 italic">"{scene.narration}"</p>
                  </div>
                </div>
              ))}
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
