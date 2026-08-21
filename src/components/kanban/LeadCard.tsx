import React, { useState } from "react";
import { Lead, PipelineStage } from "@/src/types/property";
import { GenerateContractModal } from "./GenerateContractModal";
import { MortgageCalculatorModal } from "../modals/MortgageCalculatorModal";
import { Calculator, Calendar, ExternalLink } from "lucide-react";
import { generateGoogleCalendarUrl } from "@/src/utils/calendarHelper";

interface LeadCardProps {
  lead: Lead;
  onOpenChat: (lead: Lead) => void;
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
  onMoveStage: (leadId: string, newStage: PipelineStage) => void;
  onOpenAppointmentModal: (lead: Lead) => void;
  userType?: 'INDEPENDENT_AGENT' | 'REAL_ESTATE_AGENCY';
}

export function LeadCard({
  lead,
  onOpenChat,
  onEditLead,
  onDeleteLead,
  onMoveStage,
  onOpenAppointmentModal,
  userType = 'INDEPENDENT_AGENT',
}: LeadCardProps) {
  const [showContractModal, setShowContractModal] = useState(false);
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);

  return (
    <div className="bg-[#111622]/95 p-4 rounded-2xl border border-slate-800/90 hover:border-[#D4AF37]/40 shadow-lg hover:shadow-2xl transition-all relative group font-sans backdrop-blur-md">
      {/* Card Header */}
      <div className="flex justify-between items-start mb-2">
        <span
          onClick={() => onOpenChat(lead)}
          className="text-xs font-black text-slate-100 cursor-pointer hover:text-[#F3E5AB] transition-colors leading-tight"
        >
          {lead.fullName}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => onEditLead(lead)}
            className="text-[10px] bg-[#090D16] hover:bg-slate-800 text-slate-400 hover:text-white px-1.5 py-0.5 rounded-lg border border-slate-800 transition-colors"
            title="Editar Nombre"
          >
            ✏️
          </button>
          <button
            onClick={() => onDeleteLead(lead.id)}
            className="text-[10px] bg-rose-950/40 hover:bg-rose-900/50 text-rose-400 px-1.5 py-0.5 rounded-lg border border-rose-800/40 transition-colors"
            title="Eliminar Cliente"
          >
            🗑️
          </button>
          <span className="text-[10px] text-[#F3E5AB] font-black bg-[#D4AF37]/15 px-2 py-0.5 rounded-lg border border-[#D4AF37]/30 flex items-center gap-0.5 shadow-xs font-mono">
            {lead.intentScore} 🔥
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="text-[11px] text-slate-400 mb-2.5 font-medium leading-normal">
        {lead.matchedProperty
          ? `Preguntó por: ${lead.matchedProperty.title}`
          : `Zona: ${lead.preferredZone}`}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className="text-[10px] bg-[#090D16] px-2 py-0.5 rounded-lg border border-slate-800 text-[#F3E5AB] font-mono font-bold">
          ${(lead.budgetMaxUsd ?? 0).toLocaleString()} USD
        </span>

        {lead.paymentMethod === "CREDITO_VIS" && (
          <span className="text-[10px] bg-blue-950/60 px-2 py-0.5 rounded-lg border border-blue-500/30 text-blue-300 font-bold">
            Crédito VIS
          </span>
        )}

        {lead.hasDownPayment && (
          <span className="text-[10px] bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-500/30 text-emerald-300 font-bold">
            Aporte: {lead.downPaymentPercent}%
          </span>
        )}

        {/* BANT Score Badge */}
        {lead.bantScore && lead.bantScore.score > 0 && (
          <span
            className={`text-[9px] px-2 py-0.5 rounded-lg border font-bold flex items-center gap-1 font-mono ${
              lead.bantScore.score >= 80
                ? "bg-amber-950/60 border-amber-500/40 text-amber-300"
                : lead.bantScore.score >= 50
                ? "bg-yellow-950/60 border-yellow-500/40 text-yellow-300"
                : "bg-slate-900 border-slate-700 text-slate-400"
            }`}
            title={`BANT: ${lead.bantScore.score}/100\nPresupuesto: $${
              lead.bantScore.budget
            }\nAutoridad: ${
              lead.bantScore.authority ? "Sí" : "No"
            }\nNecesidad: ${lead.bantScore.need}\nTiempo: ${lead.bantScore.timeline}`}
          >
            {lead.bantScore.score >= 80 ? "🔥" : lead.bantScore.score >= 50 ? "🟡" : "🔵"} B:{" "}
            ${(lead.bantScore.budget / 1000).toFixed(0)}k | T: {lead.bantScore.timeline}
          </span>
        )}
      </div>

      {/* Quick Stage Change Selector dinámico por tipo de pipeline */}
      <div className="mb-3">
        <select
          value={lead.pipelineStage}
          onChange={(e) => onMoveStage(lead.id, e.target.value as PipelineStage)}
          className="w-full text-[10px] font-bold text-slate-300 bg-[#090D16] border border-slate-800 rounded-xl py-1.5 px-2 outline-none focus:border-[#D4AF37] cursor-pointer"
        >
          {lead.leadType === 'SELLER_OWNER' || lead.pipelineStage === 'PROSPECTO_PROPIETARIO' || lead.pipelineStage === 'EVALUACION_INMUEBLE' || lead.pipelineStage === 'ACM_ESTUDIO_MERCADO' || lead.pipelineStage === 'AUDITORIA_DOCUMENTAL' || lead.pipelineStage === 'CONTRATO_CONSIGNACION' || lead.pipelineStage === 'INMUEBLE_CAPTADO' ? (
            <>
              <option value="PROSPECTO_PROPIETARIO">Etapa: DUEÑO PROSPECTO</option>
              <option value="EVALUACION_INMUEBLE">Etapa: INSPECCIÓN / VALÚO</option>
              <option value="ACM_ESTUDIO_MERCADO">Etapa: ESTUDIO ACM</option>
              <option value="AUDITORIA_DOCUMENTAL">Etapa: AUDITORÍA LEGAL</option>
              <option value="CONTRATO_CONSIGNACION">Etapa: CONTRATO EXCLUSIVA</option>
              <option value="INMUEBLE_CAPTADO">Etapa: PUBLICADO EN RAG</option>
            </>
          ) : lead.leadType === 'TENANT' || lead.pipelineStage === 'SOLICITUD_RENTA' || lead.pipelineStage === 'PERFILAMIENTO_INGRESOS' || lead.pipelineStage === 'VISITA_RENTA' || lead.pipelineStage === 'REVISION_GARANTIAS' || lead.pipelineStage === 'CONTRATO_RENTA_FIRMADO' ? (
            <>
              <option value="SOLICITUD_RENTA">Etapa: SOLICITUD RENTA</option>
              <option value="PERFILAMIENTO_INGRESOS">Etapa: PERFILAMIENTO</option>
              <option value="VISITA_RENTA">Etapa: VISITA INMUEBLE</option>
              <option value="REVISION_GARANTIAS">Etapa: DEPÓSITO & PÓLIZA</option>
              <option value="CONTRATO_RENTA_FIRMADO">Etapa: CONTRATO FIRMADO</option>
            </>
          ) : (
            <>
              <option value="NUEVO">Etapa: NUEVO</option>
              <option value="EN_CALIFICACION">Etapa: EN CALIFICACIÓN</option>
              <option value="CALIFICADO_VISITA_PENDIENTE">Etapa: CALIFICADO</option>
              <option value="VISITA_AGENDADA">Etapa: AGENDA</option>
              <option value="VISITA_REALIZADA">Etapa: VISITA</option>
              <option value="EN_NEGOCIACION">Etapa: NEGOCIACIÓN</option>
              <option value="CERRADO">Etapa: CERRADO</option>
            </>
          )}
        </select>
      </div>

      {/* Selector de Agentes Multi-tenant (Solo Agencias) */}
      {userType === 'REAL_ESTATE_AGENCY' && (
        <div className="mb-3">
          <select
            className="w-full text-[10px] font-bold text-slate-300 bg-[#090D16] border border-slate-800 rounded-xl py-1.5 px-2 outline-none focus:border-[#D4AF37] cursor-pointer"
            defaultValue={lead.assignedAgentId || ""}
          >
            <option value="" disabled>Asignar a agente...</option>
            <option value="agent1">Juan Pérez</option>
            <option value="agent2">Ana Gómez</option>
          </select>
        </div>
      )}

      {/* Action Buttons con Colores Diferenciados */}
      <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
        
        {/* Fila 1: Chat (Verde/Esmeralda) & Visita (Dorado/Ámbar) */}
        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => onOpenChat(lead)}
            className="w-full py-2 bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-500/40 rounded-xl text-[10px] font-bold transition-all text-center flex items-center justify-center gap-1 shadow-xs"
          >
            <span>💬 Chat WhatsApp</span>
          </button>
          <button
            onClick={() => onOpenAppointmentModal(lead)}
            className="w-full py-2 bg-amber-950/70 hover:bg-amber-900/80 text-[#F3E5AB] border border-[#D4AF37]/40 rounded-xl text-[10px] font-bold transition-all text-center flex items-center justify-center gap-1 shadow-xs"
          >
            <span>📅 Agendar Visita</span>
          </button>
        </div>

        {/* Fila 2: Cotizador Financiero (Azul/Índigo) */}
        <div>
          <button
            onClick={() => setShowCalculatorModal(true)}
            className="w-full py-2 bg-blue-950/70 hover:bg-blue-900/80 text-blue-300 border border-blue-500/40 rounded-xl text-[10px] font-bold transition-all text-center flex items-center justify-center gap-1.5 shadow-xs"
          >
            <Calculator className="w-3.5 h-3.5 text-blue-400" />
            <span>📊 Cotizar & Amortización</span>
          </button>
        </div>
        
        {/* Fila 3: Contrato Digital PDF (Cyan/Teal) */}
        {lead.matchedProperty && (
          <div>
            <button
              onClick={() => setShowContractModal(true)}
              className="w-full py-2 bg-cyan-950/70 hover:bg-cyan-900/80 text-cyan-300 border border-cyan-500/40 rounded-xl text-[10px] font-bold transition-all text-center flex items-center justify-center gap-1.5 shadow-xs"
            >
              <span>📄 Emitir Contrato Digital</span>
            </button>
          </div>
        )}

        {/* Fila 4: Cita Google Calendar (Púrpura/Violeta) */}
        {lead.appointmentDate ? (
          <div className="mt-2 bg-purple-950/60 text-purple-200 text-[10px] font-bold p-2.5 rounded-xl border border-purple-500/40 flex flex-col gap-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-purple-300">
                <Calendar className="w-3.5 h-3.5 text-purple-400" />
                <span>Cita: {new Date(lead.appointmentDate).toLocaleString('es-ES', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
              </span>
            </div>
            
            <button
              onClick={() => {
                const googleUrl = generateGoogleCalendarUrl({
                  title: `Visita Inmueble: ${lead.fullName}`,
                  description: `Cliente: ${lead.fullName}\nTel: ${lead.phoneNumber}\nInmueble: ${lead.matchedProperty?.title || 'General'}\nPresupuesto: $${(lead.budgetMaxUsd ?? 0).toLocaleString()} USD`,
                  location: `${lead.matchedProperty?.zone || lead.preferredZone || 'Santa Cruz'}`,
                  startDate: new Date(lead.appointmentDate!),
                  durationMinutes: 45,
                  clientName: lead.fullName,
                  clientPhone: lead.phoneNumber,
                  propertyTitle: lead.matchedProperty?.title,
                });
                window.open(googleUrl, "_blank");
              }}
              className="w-full py-1.5 bg-[#090D16] hover:bg-purple-900/40 text-purple-300 border border-purple-500/30 rounded-lg text-[9px] font-bold flex items-center justify-center gap-1.5 transition"
            >
              <ExternalLink className="w-3 h-3 text-purple-400" />
              <span>Ver en Google Calendar</span>
            </button>
          </div>
        ) : null}
      </div>

      {showContractModal && lead.matchedProperty && (
        <GenerateContractModal 
          lead={lead} 
          property={lead.matchedProperty} 
          onClose={() => setShowContractModal(false)} 
        />
      )}

      {showCalculatorModal && (
        <MortgageCalculatorModal
          isOpen={showCalculatorModal}
          onClose={() => setShowCalculatorModal(false)}
          lead={lead}
          property={lead.matchedProperty}
        />
      )}
    </div>
  );
}
