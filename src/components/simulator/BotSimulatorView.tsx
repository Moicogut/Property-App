import React, { useState } from "react";
import { 
  Bot, 
  Sparkles, 
  Send, 
  RefreshCw, 
  Save, 
  ShieldCheck, 
  Phone, 
  User, 
  Building2, 
  Flame, 
  MessageSquare, 
  Calendar, 
  Sliders, 
  Zap, 
  Check, 
  Layers,
  ChevronRight,
  HelpCircle,
  Clock,
  Play
} from "lucide-react";
import { Property } from "@/src/types/property";
import { supabase } from "@/src/lib/supabase";

interface BotSimulatorViewProps {
  properties: Property[];
}

interface SimulatedMessage {
  id: string;
  sender: "user" | "bot";
  text: string;
  time: string;
  matchedProperty?: Property;
  bantExtracted?: {
    budget: number;
    authority: boolean;
    need: string;
    timeline: string;
    score: number;
  };
  functionCalled?: {
    name: string;
    args: Record<string, string>;
  };
}

export const BotSimulatorView: React.FC<BotSimulatorViewProps> = ({ properties }) => {
  // Configuración del Bot
  const [botName, setBotName] = useState("Sofía IA");
  const [specialization, setSpecialization] = useState("Ventas Residenciales & Crédito VIS");
  const [tone, setTone] = useState("Ejecutivo, cálido y amable. Estilo inmobiliario boliviano. Máximo 2 oraciones.");
  const [systemRules, setSystemRules] = useState(
    "Eres Sofía, asistente virtual de Property OS. Califica al prospecto para crédito VIS/bancario y obtén su presupuesto, zona y disponibilidad de cuota inicial."
  );
  const [fallbacks, setFallbacks] = useState(
    "Si el usuario pregunta algo fuera de bienes raíces, responde amablemente que solo asistes en transacciones inmobiliarias."
  );
  const [ragStrict, setRagStrict] = useState(true);
  const [agentPhoneAlert, setAgentPhoneAlert] = useState("+591 71234567");
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Estado del Chat Simulador
  const [messages, setMessages] = useState<SimulatedMessage[]>([
    {
      id: "msg-0",
      sender: "bot",
      text: "¡Hola! Soy Sofía, asistente virtual de Property OS. ¿En qué tipo de inmueble estás interesado hoy o en qué zona buscas?",
      time: "10:00",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [activeTelemetry, setActiveTelemetry] = useState<SimulatedMessage | null>(null);

  // Guardar configuración en Supabase
  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      const payload = {
        systemRules,
        tone,
        fallbacks,
        defaultAgentPhone: agentPhoneAlert,
        botName,
        specialization,
      };

      const { data: orgs } = await supabase.from("organizations").select("id").limit(1);
      if (orgs && orgs.length > 0) {
        await supabase.from("organizations").update({ ai_config: payload }).eq("id", orgs[0].id);
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.warn("Error guardando config IA:", err);
    } finally {
      setIsSaving(false);
    }
  };

  // Motor de simulación de respuesta IA en el cliente
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text) return;

    const userMsg: SimulatedMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputMessage("");
    setIsTyping(true);

    // Simular latencia de procesamiento de LLM + RAG (600ms - 1000ms)
    setTimeout(() => {
      const lower = text.toLowerCase();
      
      // 1. Simulación RAG Match
      let matched = properties.find((p) => 
        lower.includes(p.zone.toLowerCase()) || 
        lower.includes(p.city.toLowerCase()) || 
        (lower.includes("departamento") && p.title.toLowerCase().includes("departamento")) ||
        (lower.includes("casa") && p.title.toLowerCase().includes("casa"))
      ) || properties[0];

      // 2. Simulación Extracción BANT
      let budget = 0;
      const budgetMatch = text.match(/\$?\s*(\d{2,6})\s*(usd|dolares|k)?/i);
      if (budgetMatch) {
        budget = parseInt(budgetMatch[1]);
        if (budget < 1000) budget = budget * 1000;
      } else if (matched) {
        budget = matched.priceUsd;
      }

      const hasTimeline = lower.includes("mañana") || lower.includes("semana") || lower.includes("mes") || lower.includes("urgente");
      const hasAuthority = lower.includes("yo") || lower.includes("mi esposa") || lower.includes("comprar");
      const hasNeed = lower.includes("dormitorio") || lower.includes("habitacion") || lower.includes("vis") || lower.includes("casa") || lower.includes("alquiler");

      const bantScore = {
        budget: budget || (matched ? matched.priceUsd : 85000),
        authority: hasAuthority || true,
        need: hasNeed ? text.substring(0, 40) : "Interés en compra",
        timeline: hasTimeline ? "Inmediato (1-3 semanas)" : "1-3 meses",
        score: budget && hasNeed ? 92 : hasNeed ? 75 : 60,
      };

      // 3. Simulación de Llamada a Función (agendar_visita)
      let functionCalled: SimulatedMessage["functionCalled"] = undefined;
      let replyText = "";

      if (lower.includes("visita") || lower.includes("agendar") || lower.includes("mañana") || lower.includes("hora") || lower.includes("ver")) {
        functionCalled = {
          name: "agendar_visita",
          args: {
            fecha: "2026-08-21",
            hora: "10:00 AM",
            inmueble: matched?.title || "Smart Tower 2D",
          },
        };
        replyText = `¡Excelente! He programado tu visita para *${matched?.title || "el inmueble"}* el día de mañana a las 10:00 AM. Un asesor te enviará la confirmación con el enlace de Google Calendar a este WhatsApp. 📅`;
      } else if (lower.includes("propietario") || lower.includes("vender") || lower.includes("consignar") || lower.includes("tengo una casa")) {
        replyText = `¡Con mucho gusto! En ${botName} gestionamos la captación y promoción de tu inmueble con estudio de mercado ACM y auditoría legal completa. ¿En qué zona se encuentra y qué valor estimado tiene? 📑`;
      } else if (lower.includes("alquiler") || lower.includes("renta") || lower.includes("alquilar")) {
        replyText = `¡Perfecto! Contamos con opciones de alquiler residencial y comercial. ¿Cuál es tu presupuesto mensual aproximado y en qué zona te gustaría ubicarte? 🔑`;
      } else if (matched) {
        replyText = `¡Claro! Tengo disponible "${matched.title}" en ${matched.zone} por $${matched.priceUsd.toLocaleString()} USD (${matched.acceptsSocialHousing ? "Apto para Crédito VIS" : "Venta Bancaria"}). ¿Te gustaría agendar una visita para conocerlo? 🏢`;
      } else {
        replyText = `Entiendo perfectamente. Contamos con un catálogo exclusivo en las mejores zonas. ¿Cuál es tu presupuesto máximo aproximado para presentarte las opciones ideales?`;
      }

      const botMsg: SimulatedMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        matchedProperty: matched,
        bantExtracted: bantScore,
        functionCalled,
      };

      setMessages((prev) => [...prev, botMsg]);
      setActiveTelemetry(botMsg);
      setIsTyping(false);
    }, 800);
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: "msg-0",
        sender: "bot",
        text: `¡Hola! Soy ${botName}, asistente virtual de Property OS. ¿En qué tipo de inmueble estás interesado hoy o en qué zona buscas?`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
    setActiveTelemetry(null);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0B1120] text-slate-100 overflow-hidden">
      
      {/* HEADER SUPERIOR */}
      <div className="bg-[#0F172A] border-b border-slate-800 px-6 py-3.5 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-emerald-950/40">
            <Bot className="w-5 h-5 text-slate-950" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-white tracking-tight">
                Simulador & Editor de Reglas IA en Tiempo Real
              </h2>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Sofía IA Core 2.0
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Calibra el comportamiento, tono y reglas RAG con simulación instantánea estilo WhatsApp
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveConfig}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-emerald-950/40 transition disabled:opacity-50"
          >
            {saveSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            <span>{saveSuccess ? "¡Guardado con Éxito!" : isSaving ? "Guardando..." : "Guardar en Base de Datos"}</span>
          </button>
        </div>
      </div>

      {/* CONTENEDOR DE DOS COLUMNAS */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        
        {/* COLUMNA IZQUIERDA: EDITOR DE PROMPTS Y REGLAS (6 COLS) */}
        <div className="lg:col-span-6 p-6 overflow-y-auto space-y-5 custom-scrollbar border-r border-slate-800 bg-[#0B132B]/60">
          
          {/* Identidad y Rol del Agente */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-400" />
              Identidad y Especialización del Agente
            </h3>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Nombre del Asistente</label>
                <input
                  type="text"
                  value={botName}
                  onChange={(e) => setBotName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Especialización</label>
                <select
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                >
                  <option value="Ventas Residenciales & Crédito VIS">Ventas & Crédito VIS</option>
                  <option value="Captación de Propietarios (Exclusivas)">Captación de Propietarios</option>
                  <option value="Alquileres y Arrendamiento">Alquileres & Rentas</option>
                  <option value="Inversiones y Preventas">Inversiones & Preventas</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Tono y Personalidad</label>
              <input
                type="text"
                value={tone}
                onChange={(e) => setTone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Reglas de Sistema (System Prompt) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-4 shadow-sm">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-teal-400" />
                Reglas de Negocio y Calificación BANT
              </h3>
              <span className="text-[10px] text-slate-500 font-mono">&lt;system_rules&gt;</span>
            </div>

            <textarea
              rows={4}
              value={systemRules}
              onChange={(e) => setSystemRules(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-emerald-500 custom-scrollbar"
            />

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-bold text-slate-300">Reglas de Fallback (Fuera de tema)</label>
                <span className="text-[10px] text-slate-500 font-mono">&lt;fallbacks&gt;</span>
              </div>
              <textarea
                rows={2}
                value={fallbacks}
                onChange={(e) => setFallbacks(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-slate-200 font-mono leading-relaxed focus:outline-none focus:border-emerald-500 custom-scrollbar"
              />
            </div>
          </div>

          {/* Blindaje RAG & Notificaciones */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3.5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Blindaje de Inventario y Alertas Push
            </h3>

            <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ragStrict"
                  checked={ragStrict}
                  onChange={(e) => setRagStrict(e.target.checked)}
                  className="w-4 h-4 text-emerald-500 rounded border-slate-700 focus:ring-emerald-500 cursor-pointer"
                />
                <label htmlFor="ragStrict" className="text-xs font-bold text-slate-200 cursor-pointer">
                  RAG Estricto: Prohibir citar inventario que no exista en DB
                </label>
              </div>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-mono font-bold">
                Anti-Alucinación
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Teléfono Alerta Push (WhatsApp)</label>
                <input
                  type="text"
                  value={agentPhoneAlert}
                  onChange={(e) => setAgentPhoneAlert(e.target.value)}
                  placeholder="+591 71234567"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Total Propiedades Indexadas</label>
                <div className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-emerald-400 flex items-center justify-between">
                  <span>{properties.length} Inmuebles</span>
                  <span className="text-[10px] text-slate-500 font-mono">pgvector 768d</span>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* COLUMNA DERECHA: PLAYGROUND SIMULADOR ESTILO WHATSAPP (6 COLS) */}
        <div className="lg:col-span-6 flex flex-col h-full bg-[#070D18]">
          
          {/* HEADER DEL PLAYGROUND WHATSAPP */}
          <div className="bg-[#0B1426] border-b border-slate-800 p-3.5 flex justify-between items-center shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-md">
                S
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">{botName}</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                </div>
                <p className="text-[10px] text-emerald-400 font-medium">En línea • Evolution API Sandbox</p>
              </div>
            </div>

            <button
              onClick={handleResetChat}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition flex items-center gap-1 text-[11px] font-bold"
              title="Reiniciar conversación de prueba"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Limpiar Chat</span>
            </button>
          </div>

          {/* ESCENARIOS RÁPIDOS DE PRUEBA (ONE-CLICK PROMPTS) */}
          <div className="bg-[#0B1426]/70 border-b border-slate-800 p-2.5 flex items-center gap-2 overflow-x-auto custom-scrollbar shrink-0">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Zap className="w-3 h-3 text-amber-400" /> Pruebas Rápidas:
            </span>
            
            {[
              { label: "🏢 2D Equipetrol VIS", text: "Busco un departamento de 2 dormitorios en Equipetrol con crédito VIS" },
              { label: "📑 Consignar Casa (Propietario)", text: "Hola, soy propietario de una casa en Urubó y quiero venderla con su inmobiliaria" },
              { label: "📅 Agendar Cita", text: "Me interesa coordinar una visita mañana a las 10:00 AM" },
              { label: "🔑 Alquiler", text: "Busco departamento amoblado en alquiler por $600 USD" },
            ].map((scenario) => (
              <button
                key={scenario.label}
                onClick={() => handleSendMessage(scenario.text)}
                className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-[10px] font-bold whitespace-nowrap transition border border-slate-700 shrink-0"
              >
                {scenario.label}
              </button>
            ))}
          </div>

          {/* HISTORIAL DE MENSAJES (BURBUJAS WHATSAPP) */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 custom-scrollbar bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  onClick={() => msg.sender === "bot" && setActiveTelemetry(msg)}
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-xs shadow-md transition-all ${
                    msg.sender === "user"
                      ? "bg-emerald-700 text-white rounded-br-none"
                      : "bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-none hover:border-emerald-500/50 cursor-pointer"
                  }`}
                >
                  <p className="leading-relaxed whitespace-pre-line">{msg.text}</p>
                  
                  {/* Badge de llamada a función */}
                  {msg.functionCalled && (
                    <div className="mt-2 p-2 bg-blue-950/60 border border-blue-500/40 rounded-xl text-[10px] text-blue-300 font-mono">
                      ⚡ Tool Calling: <strong>{msg.functionCalled.name}()</strong>
                      <div className="text-[9px] text-slate-400">
                        {JSON.stringify(msg.functionCalled.args)}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end items-center gap-1 text-[9px] text-slate-400 mt-1">
                    <span>{msg.time}</span>
                    {msg.sender === "user" && <span className="text-emerald-300 font-bold">✓✓</span>}
                  </div>
                </div>

                {msg.sender === "bot" && msg.bantExtracted && (
                  <button
                    onClick={() => setActiveTelemetry(msg)}
                    className="text-[9px] text-slate-500 hover:text-emerald-400 font-mono mt-0.5 ml-1"
                  >
                    🔍 Ver Telemetría BANT ({msg.bantExtracted.score} pts)
                  </button>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-2xl rounded-bl-none max-w-[120px]">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" />
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
                <span className="text-[10px] text-slate-400 font-medium ml-1">Escribiendo...</span>
              </div>
            )}
          </div>

          {/* PANEL INFERIOR: TELEMETRÍA EN VIVO (RAG + BANT) */}
          {activeTelemetry?.bantExtracted && (
            <div className="bg-[#0B1426] border-t border-slate-800 p-3 shrink-0 text-xs animate-in slide-in-from-bottom-2">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  Diagnóstico BANT & RAG de la Respuesta
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono font-bold">
                  Score: {activeTelemetry.bantExtracted.score}/100
                </span>
              </div>

              <div className="grid grid-cols-4 gap-2 text-[11px]">
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-500 font-bold block">BUDGET:</span>
                  <span className="font-bold text-white font-mono">${activeTelemetry.bantExtracted.budget.toLocaleString()} USD</span>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-500 font-bold block">AUTHORITY:</span>
                  <span className="font-bold text-emerald-400">{activeTelemetry.bantExtracted.authority ? "Titular Directo" : "No"}</span>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-500 font-bold block">TIMELINE:</span>
                  <span className="font-bold text-amber-400 truncate block">{activeTelemetry.bantExtracted.timeline}</span>
                </div>
                <div className="bg-slate-950 p-2 rounded-lg border border-slate-800">
                  <span className="text-[9px] text-slate-500 font-bold block">RAG MATCH:</span>
                  <span className="font-bold text-teal-400 truncate block">{activeTelemetry.matchedProperty?.title || "Ninguno"}</span>
                </div>
              </div>
            </div>
          )}

          {/* INPUT BAR PARA ENVIAR MENSAJE */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="p-3 bg-[#0B1426] border-t border-slate-800 flex gap-2 shrink-0"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Escribe como si fueras un prospecto de WhatsApp..."
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            <button
              type="submit"
              className="p-2.5 bg-emerald-600 hover:bg-emerald-500 text-slate-950 rounded-xl font-bold transition shadow-md flex items-center justify-center"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>

        </div>

      </div>

    </div>
  );
};
