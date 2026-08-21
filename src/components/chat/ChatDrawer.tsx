import React, { useState, useEffect, useCallback } from "react";
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
  Building,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  User
} from "lucide-react";
import { Lead, ChatMessage, Property } from "@/src/types/property";
import { AppointmentModal } from "@/src/components/modals/AppointmentModal";
import { PdfFichaModal } from "@/src/components/modals/PdfFichaModal";
import { supabase } from "@/src/lib/supabase";

interface ChatDrawerProps {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleAiPause?: (leadId: string, isPaused: boolean) => void;
  onConfirmAppointment?: (leadId: string, appointmentDetails: { date: string; time: string; agent: string; notes: string }) => void;
  onLeadUpdated?: (updatedLead: Lead) => void;
}

export const ChatDrawer: React.FC<ChatDrawerProps> = ({
  lead,
  isOpen,
  onClose,
  onToggleAiPause,
  onConfirmAppointment,
  onLeadUpdated,
}) => {
  if (!isOpen || !lead) return null;

  const [liveLead, setLiveLead] = useState<Lead>(lead);
  const [aiActive, setAiActive] = useState<boolean>(!lead.aiPaused);
  const [inputText, setInputText] = useState("");
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  // Sincronizar estado inicial cuando cambia el lead prop
  useEffect(() => {
    if (lead) {
      setLiveLead(lead);
      setAiActive(!lead.aiPaused);
    }
  }, [lead]);

  // Función para obtener mensajes y datos actualizados del lead
  const fetchLeadAndMessages = useCallback(async () => {
    if (!lead?.id) return;

    try {
      // 1. Obtener mensajes ordenados
      const { data: msgData, error: msgError } = await supabase
        .from("messages")
        .select("*")
        .eq("lead_id", lead.id)
        .order("created_at", { ascending: true });

      if (msgData && !msgError) {
        const formatted: ChatMessage[] = msgData.map((msg: { id: string; lead_id: string; sender: string; text?: string; content?: string; created_at: string }) => ({
          id: msg.id,
          leadId: msg.lead_id,
          sender: (msg.sender === "lead" || msg.sender === "USER") ? "lead" : msg.sender === "agent" ? "agent" : "ai_sofia",
          text: msg.text || msg.content || "",
          timestamp: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));
        setMessages(formatted);
      }

      // 2. Obtener datos frescos del lead y su inmueble vinculado
      const { data: lData, error: lError } = await supabase
        .from("leads")
        .select("*, matchedProperty:properties(*)")
        .eq("id", lead.id)
        .single();

      if (lData && !lError) {
        const matchedProp: Property | undefined = lData.matchedProperty ? {
          id: lData.matchedProperty.id,
          organizationId: lData.matchedProperty.organization_id || "org-1",
          title: lData.matchedProperty.title || "Inmueble Destacado",
          city: lData.matchedProperty.city || "Santa Cruz",
          zone: lData.matchedProperty.zone || "Equipetrol",
          priceUsd: Number(lData.matchedProperty.price_usd) || 0,
          bedrooms: lData.matchedProperty.bedrooms || 2,
          bathrooms: lData.matchedProperty.bathrooms || 2,
          areaSqm: Number(lData.matchedProperty.area_sqm) || 60,
          acceptsSocialHousing: Boolean(lData.matchedProperty.accepts_social_housing),
          status: lData.matchedProperty.status || "AVAILABLE",
          rawDescription: lData.matchedProperty.raw_description || "",
          imageUrl: lData.matchedProperty.image_url || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80",
          vectorIndexed: true,
          vectorDimensions: 1536,
        } : liveLead.matchedProperty;

        const updated: Lead = {
          ...liveLead,
          id: lData.id,
          fullName: lData.full_name || liveLead.fullName,
          phoneNumber: lData.phone_number || liveLead.phoneNumber,
          pipelineStage: lData.pipeline_stage || liveLead.pipelineStage,
          pipelineType: lData.pipeline_type || liveLead.pipelineType,
          leadType: lData.lead_type || liveLead.leadType,
          budgetMaxUsd: lData.bant_score?.budget || Number(lData.budget_max_usd) || liveLead.budgetMaxUsd,
          paymentMethod: lData.payment_method || liveLead.paymentMethod,
          hasDownPayment: lData.has_down_payment ?? liveLead.hasDownPayment,
          downPaymentPercent: lData.down_payment_percent || liveLead.downPaymentPercent,
          downPaymentBank: lData.down_payment_bank || liveLead.downPaymentBank,
          preferredZone: lData.preferred_zone || lData.bant_score?.preferred_zone || liveLead.preferredZone,
          aiSummary: lData.ai_summary || liveLead.aiSummary,
          aiPaused: lData.ai_paused ?? liveLead.aiPaused,
          intentScore: lData.bant_score?.score || lData.intent_score || liveLead.intentScore,
          bantScore: lData.bant_score ? {
            budget: Number(lData.bant_score.budget || 0),
            authority: Boolean(lData.bant_score.authority ?? true),
            need: String(lData.bant_score.need || ""),
            timeline: String(lData.bant_score.timeline || "Inmediata"),
            score: Number(lData.bant_score.score || 85),
          } : liveLead.bantScore,
          matchedProperty: matchedProp,
        };

        setLiveLead(updated);
        setAiActive(!updated.aiPaused);
        if (onLeadUpdated) {
          onLeadUpdated(updated);
        }
      }
    } catch (err) {
      console.warn("[ChatDrawer] Error actualizando telemetría:", err);
    }
  }, [lead?.id, liveLead, onLeadUpdated]);

  // Polling y suscripción Realtime
  useEffect(() => {
    if (!isOpen || !lead?.id) return;

    fetchLeadAndMessages();

    // Polling cada 3.5 segundos para refresco activo
    const intervalId = setInterval(fetchLeadAndMessages, 3500);

    // Canal Realtime para actualización instantánea
    const channel = supabase
      .channel(`chat-drawer-${lead.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `lead_id=eq.${lead.id}` },
        () => fetchLeadAndMessages()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'leads', filter: `id=eq.${lead.id}` },
        () => fetchLeadAndMessages()
      )
      .subscribe();

    return () => {
      clearInterval(intervalId);
      supabase.removeChannel(channel);
    };
  }, [isOpen, lead?.id, fetchLeadAndMessages]);

  const handleToggleAi = async () => {
    const nextState = !aiActive;
    setAiActive(nextState);
    setLiveLead(prev => ({ ...prev, aiPaused: !nextState }));
    
    if (onToggleAiPause) {
      onToggleAiPause(liveLead.id, !nextState);
    }
    // Guardado persistente en base de datos
    await supabase.from("leads").update({ ai_paused: !nextState }).eq("id", liveLead.id);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const currentInput = inputText;
    setInputText("");

    // Optimistic Update en UI
    const optimisticMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      leadId: liveLead.id,
      sender: "agent",
      text: currentInput,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, optimisticMsg]);

    // Pausar automáticamente la IA en UI al intervenir un humano
    setAiActive(false);
    setLiveLead(prev => ({ ...prev, aiPaused: true }));

    try {
      const res = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leadId: liveLead.id,
          text: currentInput,
        }),
      });

      if (!res.ok) {
        console.error("Error enviando mensaje WhatsApp:", await res.text());
      }
    } catch (err) {
      console.error("Error en petición /send:", err);
    }
  };

  // Helper visual para etapa de pipeline
  const getStageBadge = (stage: string) => {
    switch (stage) {
      case "VISITA_AGENDADA":
        return { label: "📅 Visita Agendada", bg: "bg-emerald-50 text-emerald-700 border-emerald-200" };
      case "CALIFICADO_VISITA_PENDIENTE":
        return { label: "⚡ Calificado (Cita Pendiente)", bg: "bg-blue-50 text-blue-700 border-blue-200" };
      case "EN_NEGOCIACION":
        return { label: "🤝 En Negociación", bg: "bg-purple-50 text-purple-700 border-purple-200" };
      case "CERRADO":
        return { label: "🏆 Cerrado / Ganado", bg: "bg-emerald-100 text-emerald-800 border-emerald-300" };
      case "NUEVO":
        return { label: "🌱 Nuevo Prospecto", bg: "bg-slate-100 text-slate-700 border-slate-200" };
      default:
        return { label: "🔍 En Calificación", bg: "bg-amber-50 text-amber-700 border-amber-200" };
    }
  };

  const stageBadge = getStageBadge(liveLead.pipelineStage);
  const scoreVal = liveLead.intentScore || liveLead.bantScore?.score || 80;

  return (
    <>
      <div className="fixed inset-0 z-40 flex justify-end bg-slate-950/60 backdrop-blur-sm transition-all duration-300">
        <div className="w-full max-w-5xl bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
          
          {/* Top Drawer Header */}
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
                  <h2 className="text-base font-bold text-white">{liveLead.fullName}</h2>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {liveLead.phoneNumber}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Canal WhatsApp • Gateway Evolution API</p>
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
                    <span>🤖 Sofía IA Autogestionando</span>
                    <span className="text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-300 ml-1">Pausar</span>
                  </>
                ) : (
                  <>
                    <PauseCircle className="w-4 h-4 text-amber-400" />
                    <span>⏸️ Modo Agente Humano</span>
                    <span className="text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded text-amber-300 ml-1">Reactivar</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Body Content Split */}
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
                    Historial de Conversación
                  </span>
                </div>

                {messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-slate-400 gap-2">
                    <Bot className="w-8 h-8 text-slate-300" />
                    <p className="text-xs">No hay mensajes previos registrados.</p>
                  </div>
                ) : (
                  messages.map((msg) => {
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
                            {liveLead.fullName.charAt(0)}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input Form */}
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
                  placeholder={aiActive ? "Escribe un mensaje (Pausará a Sofía IA)..." : "Escribe un mensaje como Agente Humano..."}
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

            {/* RIGHT: Ficha Lateral de Calificación IA (Realtime Telemetry) */}
            <div className="w-96 bg-white p-5 flex flex-col gap-4 overflow-y-auto border-l border-slate-200">
              
              {/* Header Info & Stage */}
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="w-11 h-11 bg-gradient-to-br from-slate-900 to-slate-700 text-emerald-400 rounded-xl flex items-center justify-center font-bold text-sm shadow-sm">
                  {liveLead.fullName.split(" ").map(n => n[0]).slice(0, 2).join("")}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 truncate">{liveLead.fullName}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${stageBadge.bg}`}>
                      {stageBadge.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* BANT Qualification Thermometer */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3.5 shadow-sm">
                
                {/* Score Bar */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-1.5">
                    <Flame className={`w-4 h-4 ${scoreVal >= 80 ? 'text-amber-500 fill-amber-500' : 'text-slate-400'}`} />
                    <h5 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Telemetría BANT</h5>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    scoreVal >= 80 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : scoreVal >= 60 
                      ? 'bg-amber-50 text-amber-700 border-amber-200' 
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {scoreVal >= 80 ? `🔥 Hot Lead (${scoreVal}/100)` : `⚡ Calificando (${scoreVal}/100)`}
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 rounded-full ${
                      scoreVal >= 80 ? 'bg-emerald-500' : scoreVal >= 60 ? 'bg-amber-500' : 'bg-slate-400'
                    }`}
                    style={{ width: `${Math.min(scoreVal, 100)}%` }}
                  />
                </div>

                {/* 4 Pillars Grid (B-A-N-T) */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  
                  {/* Budget */}
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
                    <div className="flex items-center gap-1 text-[9px] text-slate-500 font-semibold uppercase">
                      <DollarSign className="w-3 h-3 text-emerald-600" /> Presupuesto (B)
                    </div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                      ${(liveLead.budgetMaxUsd ?? 0).toLocaleString()} USD
                    </div>
                    <div className="text-[9px] text-slate-500 truncate mt-0.5">
                      {liveLead.paymentMethod === "CREDITO_VIS" ? "Crédito ASFI (VIS)" : liveLead.paymentMethod || "Por definir"}
                    </div>
                  </div>

                  {/* Authority / Down payment */}
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
                    <div className="flex items-center gap-1 text-[9px] text-slate-500 font-semibold uppercase">
                      <ShieldCheck className="w-3 h-3 text-blue-600" /> Aporte / Poder (A)
                    </div>
                    <div className={`text-xs font-bold mt-0.5 truncate ${liveLead.hasDownPayment ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {liveLead.hasDownPayment ? `Inicial ${liveLead.downPaymentPercent}%` : "Pendiente"}
                    </div>
                    <div className="text-[9px] text-slate-500 truncate mt-0.5">
                      {liveLead.downPaymentBank || "Decisor Titular"}
                    </div>
                  </div>

                  {/* Need / Preferred Zone */}
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
                    <div className="flex items-center gap-1 text-[9px] text-slate-500 font-semibold uppercase">
                      <MapPin className="w-3 h-3 text-rose-500" /> Zona Preferida (N)
                    </div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                      {liveLead.preferredZone || "Por definir"}
                    </div>
                    <div className="text-[9px] text-slate-500 truncate mt-0.5">
                      {liveLead.leadType === "TENANT" ? "Renta / Alquiler" : "Compra Inmueble"}
                    </div>
                  </div>

                  {/* Timeline / Urgencia */}
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-xs">
                    <div className="flex items-center gap-1 text-[9px] text-slate-500 font-semibold uppercase">
                      <Clock className="w-3 h-3 text-purple-600" /> Plazo / Tiempo (T)
                    </div>
                    <div className="text-xs font-bold text-slate-900 mt-0.5 truncate">
                      {liveLead.bantScore?.timeline || "Inmediata / 30d"}
                    </div>
                    <div className="text-[9px] text-emerald-600 font-medium truncate mt-0.5">
                      Alta prioridad
                    </div>
                  </div>

                </div>

                {/* AI Executive Diagnosis */}
                <div className="bg-emerald-50/70 border border-emerald-100 rounded-lg p-2.5">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-900 mb-1">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Diagnóstico IA Sofía</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-snug">
                    {liveLead.aiSummary || "Lead en perfilamiento automático. Sofía IA está explorando requerimientos de zona y presupuesto."}
                  </p>
                </div>

                {/* Match Inmueble RAG */}
                {liveLead.matchedProperty && (
                  <div className="bg-white border border-emerald-200 rounded-lg p-2.5 shadow-xs">
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Match RAG Recomendado
                    </div>
                    <div className="flex gap-2.5 items-center">
                      <div className="w-12 h-12 bg-slate-100 rounded-lg overflow-hidden shrink-0 border border-slate-200">
                        <img 
                          src={liveLead.matchedProperty.imageUrl || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80"} 
                          alt={liveLead.matchedProperty.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {liveLead.matchedProperty.title}
                        </div>
                        <div className="text-[10px] text-slate-500 truncate">
                          {liveLead.matchedProperty.zone}, {liveLead.matchedProperty.city}
                        </div>
                        <div className="text-[10px] text-emerald-700 font-bold mt-0.5">
                          ${(liveLead.matchedProperty?.priceUsd ?? 0).toLocaleString()} USD • 98% Afinidad
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
                  className="w-full py-2.5 bg-white border border-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 shadow-xs"
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
        lead={liveLead}
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
        lead={liveLead}
        onClose={() => setIsPdfModalOpen(false)}
      />
    </>
  );
};

