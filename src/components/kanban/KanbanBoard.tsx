import React from "react";
import { Lead, PipelineStage } from "@/src/types/property";
import { LeadCard } from "./LeadCard";

interface KanbanBoardProps {
  leads: Lead[];
  onOpenChat: (lead: Lead) => void;
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
  onMoveStage: (leadId: string, newStage: PipelineStage) => void;
  onOpenAppointmentModal: (lead: Lead) => void;
}

export const kanbanColumns: { stage: PipelineStage; label: string; countBadge: string }[] = [
  { stage: "NUEVO", label: "NUEVO", countBadge: "bg-slate-200 text-slate-800" },
  { stage: "EN_CALIFICACION", label: "EN CALIFICACIÓN", countBadge: "bg-slate-200 text-slate-800" },
  { stage: "CALIFICADO_VISITA_PENDIENTE", label: "CALIFICADO", countBadge: "bg-emerald-100 text-emerald-800" },
  { stage: "VISITA_AGENDADA", label: "AGENDA", countBadge: "bg-emerald-100 text-emerald-800" },
  { stage: "VISITA_REALIZADA", label: "VISITA", countBadge: "bg-slate-200 text-slate-800" },
  { stage: "EN_NEGOCIACION", label: "NEGOCIACIÓN", countBadge: "bg-slate-200 text-slate-800" },
  { stage: "CERRADO", label: "CERRADO", countBadge: "bg-emerald-500 text-white" },
];

export function KanbanBoard({
  leads,
  onOpenChat,
  onEditLead,
  onDeleteLead,
  onMoveStage,
  onOpenAppointmentModal,
}: KanbanBoardProps) {
  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F1F5F9] h-full overflow-hidden">
      <div className="p-4 flex gap-4 overflow-x-auto h-full custom-scrollbar snap-x snap-mandatory">
        {kanbanColumns.map((col) => {
          const stageLeads = leads.filter((l) => l.pipelineStage === col.stage);

          return (
            <div
              key={col.stage}
              className="flex-1 flex flex-col min-w-[85vw] sm:min-w-[280px] max-w-[320px] snap-center shrink-0"
            >
              {/* Column Header */}
              <h3 className="text-xs font-bold text-slate-500 mb-3 flex items-center justify-between uppercase tracking-widest shrink-0">
                <span>{col.label}</span>
                <span
                  className={`${col.countBadge} px-2 py-0.5 rounded text-[10px] font-mono font-bold`}
                >
                  {stageLeads.length}
                </span>
              </h3>

              {/* Card List Container */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                {stageLeads.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    onOpenChat={onOpenChat}
                    onEditLead={onEditLead}
                    onDeleteLead={onDeleteLead}
                    onMoveStage={onMoveStage}
                    onOpenAppointmentModal={onOpenAppointmentModal}
                  />
                ))}

                {stageLeads.length === 0 && (
                  <div className="p-4 text-center text-[11px] text-slate-400 border border-dashed border-slate-300 rounded-xl">
                    Sin tarjetas
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
