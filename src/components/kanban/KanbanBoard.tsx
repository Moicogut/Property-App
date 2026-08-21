import React, { useState, useMemo } from "react";
import { 
  Lead, 
  PipelineStage, 
  PipelineType 
} from "@/src/types/property";
import { LeadCard } from "./LeadCard";
import { 
  Building, 
  FileText, 
  Key, 
  Layers, 
  DollarSign, 
  CheckCircle2, 
  Filter,
  Plus
} from "lucide-react";

interface KanbanBoardProps {
  leads: Lead[];
  onOpenChat: (lead: Lead) => void;
  onEditLead: (lead: Lead) => void;
  onDeleteLead: (leadId: string) => void;
  onMoveStage: (leadId: string, newStage: PipelineStage) => void;
  onOpenAppointmentModal: (lead: Lead) => void;
  userType?: 'INDEPENDENT_AGENT' | 'REAL_ESTATE_AGENCY';
}

export interface PipelineColumnDef {
  stage: PipelineStage;
  label: string;
  countBadge: string;
  colorBorder?: string;
}

export const PIPELINES_CONFIG: Record<PipelineType, {
  name: string;
  icon: any;
  description: string;
  columns: PipelineColumnDef[];
}> = {
  VENTAS: {
    name: "Ventas & Compradores",
    icon: Building,
    description: "Pipeline de prospectos calificados por Sofía IA para compra de propiedades",
    columns: [
      { stage: "NUEVO", label: "NUEVO", countBadge: "bg-slate-200 text-slate-800" },
      { stage: "EN_CALIFICACION", label: "EN CALIFICACIÓN", countBadge: "bg-slate-200 text-slate-800" },
      { stage: "CALIFICADO_VISITA_PENDIENTE", label: "CALIFICADO", countBadge: "bg-emerald-100 text-emerald-800" },
      { stage: "VISITA_AGENDADA", label: "AGENDA", countBadge: "bg-blue-100 text-blue-800" },
      { stage: "VISITA_REALIZADA", label: "VISITA", countBadge: "bg-purple-100 text-purple-800" },
      { stage: "EN_NEGOCIACION", label: "NEGOCIACIÓN", countBadge: "bg-amber-100 text-amber-800" },
      { stage: "CERRADO", label: "CERRADO", countBadge: "bg-emerald-500 text-white" },
    ],
  },
  CAPTACIONES: {
    name: "Captación de Inmuebles",
    icon: FileText,
    description: "Pipeline de propietarios que consignan sus casas y departamentos en la agencia",
    columns: [
      { stage: "PROSPECTO_PROPIETARIO", label: "DUEÑO PROSPECTO", countBadge: "bg-slate-200 text-slate-800" },
      { stage: "EVALUACION_INMUEBLE", label: "INSPECCIÓN / VALÚO", countBadge: "bg-indigo-100 text-indigo-800" },
      { stage: "ACM_ESTUDIO_MERCADO", label: "ESTUDIO ACM", countBadge: "bg-amber-100 text-amber-800" },
      { stage: "AUDITORIA_DOCUMENTAL", label: "AUDITORÍA LEGAL", countBadge: "bg-rose-100 text-rose-800" },
      { stage: "CONTRATO_CONSIGNACION", label: "CONTRATO EXCLUSIVA", countBadge: "bg-blue-100 text-blue-800" },
      { stage: "INMUEBLE_CAPTADO", label: "PUBLICADO EN RAG", countBadge: "bg-emerald-500 text-white" },
    ],
  },
  ALQUILERES: {
    name: "Rentas & Inquilinos",
    icon: Key,
    description: "Pipeline de solicitudes de arrendamiento y calificación de solvencia",
    columns: [
      { stage: "SOLICITUD_RENTA", label: "SOLICITUD RENTA", countBadge: "bg-slate-200 text-slate-800" },
      { stage: "PERFILAMIENTO_INGRESOS", label: "PERFILAMIENTO", countBadge: "bg-indigo-100 text-indigo-800" },
      { stage: "VISITA_RENTA", label: "VISITA INMUEBLE", countBadge: "bg-purple-100 text-purple-800" },
      { stage: "REVISION_GARANTIAS", label: "DEPÓSITO & PÓLIZA", countBadge: "bg-amber-100 text-amber-800" },
      { stage: "CONTRATO_RENTA_FIRMADO", label: "CONTRATO FIRMADO", countBadge: "bg-emerald-500 text-white" },
    ],
  },
};

/**
 * Función auxiliar para inferir a qué pipeline pertenece un lead
 */
export function getLeadPipelineType(lead: Lead): PipelineType {
  if (lead.pipelineType) return lead.pipelineType;
  if (lead.leadType === 'SELLER_OWNER') return 'CAPTACIONES';
  if (lead.leadType === 'TENANT') return 'ALQUILERES';

  // Si no está explícito, inferir por su stage
  const captacionStages: PipelineStage[] = [
    'PROSPECTO_PROPIETARIO',
    'EVALUACION_INMUEBLE',
    'ACM_ESTUDIO_MERCADO',
    'AUDITORIA_DOCUMENTAL',
    'CONTRATO_CONSIGNACION',
    'INMUEBLE_CAPTADO',
  ];
  if (captacionStages.includes(lead.pipelineStage)) return 'CAPTACIONES';

  const rentaStages: PipelineStage[] = [
    'SOLICITUD_RENTA',
    'PERFILAMIENTO_INGRESOS',
    'VISITA_RENTA',
    'REVISION_GARANTIAS',
    'CONTRATO_RENTA_FIRMADO',
  ];
  if (rentaStages.includes(lead.pipelineStage)) return 'ALQUILERES';

  return 'VENTAS';
}

export function KanbanBoard({
  leads,
  onOpenChat,
  onEditLead,
  onDeleteLead,
  onMoveStage,
  onOpenAppointmentModal,
  userType,
}: KanbanBoardProps) {
  const [activePipeline, setActivePipeline] = useState<PipelineType>('VENTAS');

  const currentConfig = PIPELINES_CONFIG[activePipeline];

  // Filtrado de leads para el pipeline seleccionado
  const pipelineLeads = useMemo(() => {
    return leads.filter((lead) => getLeadPipelineType(lead) === activePipeline);
  }, [leads, activePipeline]);

  // Métricas rápidas del pipeline activo
  const totalVolume = useMemo(() => {
    return pipelineLeads.reduce((acc, l) => acc + (l.budgetMaxUsd || 0), 0);
  }, [pipelineLeads]);

  const closedCount = useMemo(() => {
    return pipelineLeads.filter((l) => 
      l.pipelineStage === 'CERRADO' || 
      l.pipelineStage === 'INMUEBLE_CAPTADO' || 
      l.pipelineStage === 'CONTRATO_RENTA_FIRMADO'
    ).length;
  }, [pipelineLeads]);

  // Conteos por cada tipo de pipeline
  const pipelineCounts = useMemo(() => {
    const counts: Record<PipelineType, number> = { VENTAS: 0, CAPTACIONES: 0, ALQUILERES: 0 };
    leads.forEach((l) => {
      const type = getLeadPipelineType(l);
      counts[type] = (counts[type] || 0) + 1;
    });
    return counts;
  }, [leads]);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#F1F5F9] h-full overflow-hidden">
      
      {/* 1. BARRA SUPERIOR DE SELECTOR DE MULTI-PIPELINES */}
      <div className="bg-white border-b border-slate-200 px-4 py-2.5 flex flex-wrap justify-between items-center gap-3 shrink-0 shadow-xs">
        
        {/* Selector de Pestañas de Embudos */}
        <div className="flex items-center gap-2">
          {(['VENTAS', 'CAPTACIONES', 'ALQUILERES'] as PipelineType[]).map((pType) => {
            const pConfig = PIPELINES_CONFIG[pType];
            const Icon = pConfig.icon;
            const isActive = activePipeline === pType;

            return (
              <button
                key={pType}
                onClick={() => setActivePipeline(pType)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span>{pConfig.name}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-slate-800 text-emerald-400 font-bold' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {pipelineCounts[pType]}
                </span>
              </button>
            );
          })}
        </div>

        {/* Resumen Ejecutivo del Embudo Activo */}
        <div className="hidden sm:flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5 text-slate-600">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>En Cartera: <strong>{pipelineLeads.length}</strong></span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-600">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            <span>Volumen Estimado: <strong className="text-slate-900 font-mono">${totalVolume.toLocaleString('es-ES')} USD</strong></span>
          </div>

          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-lg border border-emerald-100 font-bold text-[11px]">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>{closedCount} Cierres Exitosos</span>
          </div>
        </div>

      </div>

      {/* 2. TABLERO KANBAN MULTI-COLUMNAS */}
      <div className="p-4 flex gap-4 overflow-x-auto h-full custom-scrollbar snap-x snap-mandatory">
        {currentConfig.columns.map((col) => {
          const stageLeads = pipelineLeads.filter((l) => l.pipelineStage === col.stage);

          return (
            <div
              key={col.stage}
              className="flex-1 flex flex-col min-w-[85vw] sm:min-w-[280px] max-w-[320px] snap-center shrink-0"
            >
              {/* Column Header */}
              <h3 className="text-xs font-bold text-slate-600 mb-3 flex items-center justify-between uppercase tracking-widest shrink-0">
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
                    userType={userType}
                  />
                ))}

                {stageLeads.length === 0 && (
                  <div className="p-5 text-center text-[11px] text-slate-400 border border-dashed border-slate-300 rounded-2xl bg-white/40">
                    Sin prospectos en esta etapa
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
