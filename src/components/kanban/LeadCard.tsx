import React from "react";
import { Lead, PipelineStage } from "@/src/types/property";

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
  return (
    <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all relative group">
      {/* Card Header */}
      <div className="flex justify-between items-start mb-2">
        <span
          onClick={() => onOpenChat(lead)}
          className="text-xs font-bold text-slate-900 cursor-pointer hover:text-emerald-600 transition-colors"
        >
          {lead.fullName}
        </span>
        <div className="flex gap-1">
          <button
            onClick={() => onEditLead(lead)}
            className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
            title="Editar Nombre"
          >
            ✏️
          </button>
          <button
            onClick={() => onDeleteLead(lead.id)}
            className="text-[10px] bg-rose-50 hover:bg-rose-100 text-rose-600 px-1.5 py-0.5 rounded cursor-pointer transition-colors"
            title="Eliminar Cliente"
          >
            🗑️
          </button>
          <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 flex items-center gap-0.5">
            {lead.intentScore} 🔥
          </span>
        </div>
      </div>

      {/* Details */}
      <div className="text-[10px] text-slate-500 mb-2 font-medium">
        {lead.matchedProperty
          ? `Preguntó por: ${lead.matchedProperty.title}`
          : `Zona: ${lead.preferredZone}`}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-1 mb-3">
        <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-600 font-bold">
          ${(lead.budgetMaxUsd ?? 0).toLocaleString()} USD
        </span>

        {lead.paymentMethod === "CREDITO_VIS" && (
          <span className="text-[9px] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 text-blue-700 font-bold italic">
            Crédito VIS
          </span>
        )}

        {lead.hasDownPayment && (
          <span className="text-[9px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 text-emerald-700 font-bold">
            Aporte: {lead.downPaymentPercent}%
          </span>
        )}

        {/* BANT Score Badge */}
        {lead.bantScore && lead.bantScore.score > 0 && (
          <span
            className={`text-[9px] px-1.5 py-0.5 rounded border font-bold flex items-center gap-0.5 ${
              lead.bantScore.score >= 80
                ? "bg-orange-50 border-orange-200 text-orange-700"
                : lead.bantScore.score >= 50
                ? "bg-yellow-50 border-yellow-200 text-yellow-700"
                : "bg-slate-50 border-slate-200 text-slate-600"
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

      {/* Quick Stage Change Selector */}
      <div className="mb-2.5">
        <select
          value={lead.pipelineStage}
          onChange={(e) => onMoveStage(lead.id, e.target.value as PipelineStage)}
          className="w-full text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded py-1 px-1.5 outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
        >
          <option value="NUEVO">Etapa: NUEVO</option>
          <option value="EN_CALIFICACION">Etapa: EN CALIFICACIÓN</option>
          <option value="CALIFICADO_VISITA_PENDIENTE">Etapa: CALIFICADO</option>
          <option value="VISITA_AGENDADA">Etapa: AGENDA</option>
          <option value="VISITA_REALIZADA">Etapa: VISITA</option>
          <option value="EN_NEGOCIACION">Etapa: NEGOCIACIÓN</option>
          <option value="CERRADO">Etapa: CERRADO</option>
        </select>
      </div>

      {/* Selector de Agentes Multi-tenant (Solo Agencias) */}
      {userType === 'REAL_ESTATE_AGENCY' && (
        <div className="mb-2.5">
          <select
            className="w-full text-[10px] font-bold text-slate-600 bg-white border border-slate-200 rounded py-1 px-1.5 outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            defaultValue={lead.assignedAgentId || ""}
          >
            <option value="" disabled>Asignar a agente...</option>
            <option value="agent1">Juan Pérez</option>
            <option value="agent2">Ana Gómez</option>
          </select>
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-100">
        <button
          onClick={() => onOpenChat(lead)}
          className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-[10px] font-bold transition-colors text-center"
        >
          💬 Chat
        </button>
        <button
          onClick={() => onOpenAppointmentModal(lead)}
          className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-[10px] font-bold transition-colors text-center shadow-xs"
        >
          📅 Visita
        </button>
      </div>

      {/* Cita Inteligente (Si existe) */}
      {lead.appointmentDate ? (
        <div className="mt-2.5 bg-emerald-50 text-emerald-700 text-[10px] font-bold py-1.5 px-2 rounded-md border border-emerald-100 flex items-center justify-center gap-1.5 shadow-sm">
          <span>📅 Cita: {new Date(lead.appointmentDate).toLocaleString()}</span>
        </div>
      ) : null}
    </div>
  );
}
