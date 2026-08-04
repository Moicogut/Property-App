import React, { useState } from "react";
import { 
  X, 
  Send, 
  Bot, 
  CheckCircle2, 
  Calendar, 
  FileText, 
  Flame, 
  DollarSign, 
  PauseCircle, 
  Plus, 
  Sparkles, 
  ExternalLink, 
  ShieldCheck,
  Building
} from "lucide-react";
import { Lead, ChatMessage } from "@/src/types/property";
import { AppointmentModal } from "@/src/components/modals/AppointmentModal";
import { PdfFichaModal } from "@/src/components/modals/PdfFichaModal";
import { supabase } from "@/src/lib/supabase";

interface ChatDrawerProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleAiPause?: (leadId: string, isPaused: boolean) => void;
  onConfirmAppointment?: (leadId: string, appointmentDetails: { date: string; time: string; agent: string; notes: string }) => void;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  lead,
  isOpen,
  onClose,
  onToggleAiPause,
  onConfirmAppointment,
}) => {
  if (!isOpen || !lead) return null;

  const [aiActive, setAiActive] = useState(!lead.aiPaused);
  const [inputText, setInputText] = useState("");
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);

  const [messages, setMessages] = useState<ChatMessage[]>([]);

  React.useEffect(() => {
    if (!isOpen || !lead) return;

    let intervalId: NodeJS.Timeout;

    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("lead_id", lead.id)
        .order("created_at", { ascending: true });

      if (data && !error) {
        const formatted = data.map((msg) => ({
          id: msg.id,
          leadId: msg.lead_id,
          sender: msg.sender as any,
          text: msg.text,
          timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));
        setMessages(formatted);
      }
    };

    fetchMessages();
    
    // Polling simple para "tiempo real"
    intervalId = setInterval(fetchMessages, 3000);

    return () => clearInterval(intervalId);
  }, [isOpen, lead]);

  const handleToggleAi = async () => {
    const nextState = !aiActive;
    setAiActive(nextState);
    if (onToggleAiPause) {
      onToggleAiPause(lead.id, !nextState);
    }
    // Pausar en BD de forma persistente
    await supabase.from("leads").update({ ai_paused: !nextState }).eq("id", lead.id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const currentInput = inputText;
    setInputText("");

    // Agregar visualmente el mensaje de inmediato (optimistic update)
    const optimisticMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      leadId: lead.id,
      sender: "agent",
      text: currentInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    // Pausar la IA en UI porque un humano intervino
    setAiActive(false);

    try {
      // Enviar a la API que insertará en Supabase y enviará por WhatsApp
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: lead.id,
          text: currentInput,
        }),
      });

      if (!res.ok) {
        console.error("Error enviando mensaje", await res.text());
      }
    } catch (err) {
      console.error("Error en petición /send", err);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex justify-end bg-slate-950/60 backdrop-blur-sm transition-all duration-300">
        <div className="w-full max-w-5xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          
          {/* Top Drawer Header - Professional Polish Theme */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-slate-800 bg-[#0F172A] text-white">
            <div className="flex items-center gap-4">
              <button 
                onClick={onClose}
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
                title="Cerrar Chat"
              >
                <X className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-white">{lead.fullName}</h2>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {lead.phoneNumber}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Canal WhatsApp • Evolution API Gateway Active</p>
              </div>
            </div>

            {/* AI Toggle Controls */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleToggleAi}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg border text-xs font-bold transition-all shadow-sm ${
                  aiActive 
                    ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20" 
                    : "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                }`}
              >
                {aiActive ? (
                  <>
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#10B981]" />
                    <span>🤖 IA Sofía Activa</span>
                    <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-300 ml-1">Pausar</span>
                  </>
                ) : (
                  <>
                    <PauseCircle className="w-4 h-4 text-amber-400" />
                    <span>⏸️ Tomar Control (Agente)</span>
                    <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-300 ml-1">Reactivar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Body Content split */}
          <div className="flex-1 flex overflow-hidden">
            
            {/* LEFT: Live Chat Window */}
            <div className="flex-1 flex flex-col bg-[#F8FAFC] border-r border-slate-200 relative">
              
              {/* Chat Status Banner */}
              <div className="bg-slate-100 border-b border-slate-200 px-4 py-2 text-xs text-slate-600 flex justify-between items-center z-10">
                <span className="flex items-center gap-1.5 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Conexión WhatsApp Evolution API
                </span>
                <span className="text-[11px] font-bold text-slate-500">
                  {aiActive ? "Autogestionado por Sofía IA" : "Modo Manual (Agente Humano)"}
                </span>
              </div>

              {/* Message List */}
              <div className="flex-1 overflow-y-auto p-5 space-y-3.5 z-10">
                <div className="text-center my-1">
                  <span className="bg-slate-200 text-slate-600 px-2.5 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider">
                    Conversación Activa
                  </span>
                </div>

                {messages.map((msg) => {
                  const isLead = msg.sender === "lead";
                  const isAi = msg.sender === "ai_sofia";

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-2 ${isLead ? "justify-start" : "justify-end"}`}
                    >
                      {!isLead && isAi && (
                        <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                          <Bot className="w-4 h-4" />
                        </div>
                      )}

                      <div
                        className={`max-w-[80%] p-3 rounded-xl text-xs shadow-sm ${
                          isLead
                            ? "bg-white text-slate-900 rounded-tl-none border border-slate-200"
                            : isAi
                            ? "bg-emerald-600 text-white rounded-tr-none shadow"
                            : "bg-[#0F172A] text-white rounded-tr-none"
                        }`}
                      >
                        <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                        <div className="flex items-center justify-end gap-1.5 mt-1">
                          <span className={`text-[10px] ${isLead ? "text-slate-400" : isAi ? "text-emerald-100" : "text-slate-400"}`}>
                            {msg.timestamp}
                          </span>
                          {isAi && (
                            <span className="text-[9px] font-bold bg-emerald-700/60 px-1 py-0.2 rounded text-emerald-100">
                              Sofía IA
                            </span>
                          )}
                          {!isLead && !isAi && (
                            <span className="text-[9px] font-bold bg-slate-800 px-1 py-0.2 rounded text-slate-300">
                              Humano
                            </span>
                          )}
                        </div>
                      </div>

                      {isLead && (
                        <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 font-bold text-xs">
                          {lead.fullName.charAt(0)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendMessage} className="p-3 bg-white border-t border-slate-200 flex items-center gap-2 z-10">
                <button 
                  type="button" 
                  onClick={() => setIsPdfModalOpen(true)}
                  className="p-2 text-slate-400 hover:text-slate-600 transition-colors"
                  title="Adjuntar Ficha Inmobiliaria PDF"
                >
                  <Plus className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={aiActive ? "Escribe un mensaje..." : "Escribe un mensaje como Agente Humano..."}
                  className="flex-1 bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-900 outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                />
                <button
                  type="submit"
                  className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-500 transition-colors shadow-sm"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>

            </div>

            {/* RIGHT: Ficha de Calificación IA */}
            <div className="w-96 bg-white p-5 flex flex-col gap-5 overflow-y-auto border-l border-slate-200">
              
              {/* Header Info */}
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center font-bold text-slate-700">
                  {lead.fullName.split(" ").map(n => n[0]).join("")}
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{lead.fullName}</h4>
                  <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">
                    {aiActive ? "🤖 IA Sofía Activa" : "⏸️ Control Humano"}
                  </p>
                </div>
              </div>

              {/* Qualification Diagnosis */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                <div className="flex justify-between items-center mb-2">
                  <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ficha de Calificación IA</h5>
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
                    Score {lead.intentScore} 🔥
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <div className="text-[9px] text-slate-500 font-medium">Presupuesto</div>
                    <div className="text-xs font-bold text-slate-900">${(lead.budgetMaxUsd ?? 0).toLocaleString()} USD</div>
                  </div>

                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <div className="text-[9px] text-slate-500 font-medium">Tipo de Pago</div>
                    <div className="text-xs font-bold text-slate-900">
                      {lead.paymentMethod === "CREDITO_VIS" ? "Crédito ASFI" : lead.paymentMethod}
                    </div>
                  </div>

                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <div className="text-[9px] text-slate-500 font-medium">Aporte Propio</div>
                    <div className="text-xs font-bold text-emerald-600">
                      {lead.hasDownPayment ? `Confirmado (${lead.downPaymentPercent}%)` : "Pendiente"}
                    </div>
                  </div>

                  <div className="bg-white p-2 rounded-lg border border-slate-200">
                    <div className="text-[9px] text-slate-500 font-medium">Zona Preferida</div>
                    <div className="text-xs font-bold text-slate-900">{lead.preferredZone}</div>
                  </div>
                </div>

                {/* Match Inmueble RAG */}
                {lead.matchedProperty && (
                  <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-2.5">
                    <div className="flex gap-2.5 items-center">
                      <div className="w-12 h-12 bg-slate-200 rounded-lg overflow-hidden shrink-0 border border-emerald-200">
                        <img 
                          src={lead.matchedProperty.imageUrl} 
                          alt={lead.matchedProperty.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-slate-900">{lead.matchedProperty.title}</div>
                        <div className="text-[10px] text-emerald-700 font-bold">
                          Match RAG: 98% compatible (${(lead.matchedProperty?.priceUsd ?? 0).toLocaleString()} USD)
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="mt-auto flex flex-col gap-2 pt-2">
                <button 
                  onClick={() => setIsAppointmentModalOpen(true)}
                  className="w-full py-2.5 bg-[#0F172A] text-white rounded-lg text-xs font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Calendar className="w-4 h-4 text-emerald-400" />
                  <span>📅 Agendar Visita en Google Calendar</span>
                </button>

                <button 
                  onClick={() => setIsPdfModalOpen(true)}
                  className="w-full py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>📄 Generar Ficha PDF de Reserva</span>
                </button>

                <button 
                  onClick={handleToggleAi}
                  className="w-full py-2 border border-slate-200 text-slate-600 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  {aiActive ? "⏸️ Pausar IA y Tomar Control" : "▶️ Reactivar Agente IA Sofía"}
                </button>
              </div>

            </div>

          </div>

        </div>
      </div>

      {/* Appointment Scheduler Modal */}
      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        lead={lead}
        onClose={() => setIsAppointmentModalOpen(false)}
        onConfirmAppointment={(leadId, details) => {
          if (onConfirmAppointment) {
            onConfirmAppointment(leadId, details);
          }
        }}
      />

      {/* PDF / Voucher Modal */}
      <PdfFichaModal
        isOpen={isPdfModalOpen}
        lead={lead}
        onClose={() => setIsPdfModalOpen(false)}
      />
    </>
  );
};
