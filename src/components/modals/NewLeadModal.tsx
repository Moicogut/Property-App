import React, { useState } from "react";
import { 
  X, 
  UserPlus, 
  Sparkles, 
  DollarSign, 
  MapPin, 
  Building, 
  ShieldCheck, 
  FileText, 
  Key 
} from "lucide-react";
import { 
  Lead, 
  PipelineStage, 
  PipelineType, 
  LeadType, 
  PaymentMethod, 
  Property 
} from "@/src/types/property";

interface NewLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddLead: (newLead: Lead) => void;
  properties: Property[];
  existingLeads?: Lead[];
  onOpenExistingLead?: (lead: Lead) => void;
}

export const NewLeadModal: React.FC<NewLeadModalProps> = ({
  isOpen,
  onClose,
  onAddLead,
  properties,
  existingLeads = [],
  onOpenExistingLead,
}) => {
  if (!isOpen) return null;

  const [pipelineType, setPipelineType] = useState<PipelineType>("VENTAS");
  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("+591 ");
  const [budgetMaxUsd, setBudgetMaxUsd] = useState<number | "">("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("POR_DEFINIR");
  const [hasDownPayment, setHasDownPayment] = useState(false);
  const [downPaymentPercent, setDownPaymentPercent] = useState<number | "">("");
  const [downPaymentBank, setDownPaymentBank] = useState("");
  const [preferredZone, setPreferredZone] = useState("");
  const [pipelineStage, setPipelineStage] = useState<PipelineStage>("NUEVO");
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("");
  const [aiSummary, setAiSummary] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState<Lead | null>(null);

  // Verificación de duplicado en tiempo real al ingresar teléfono
  const handlePhoneChange = (val: string) => {
    setPhoneNumber(val);
    const clean = val.replace(/\D/g, "");
    if (clean.length >= 8) {
      const found = existingLeads.find((l) => {
        const lClean = l.phoneNumber.replace(/\D/g, "");
        return lClean.endsWith(clean.slice(-8)) || clean.endsWith(lClean.slice(-8));
      });
      setDuplicateWarning(found || null);
    } else {
      setDuplicateWarning(null);
    }
  };

  // Manejo de cambio de pipeline type para fijar etapa inicial adecuada sin alterar valores de negocio
  const handlePipelineTypeChange = (type: PipelineType) => {
    setPipelineType(type);
    if (type === "CAPTACIONES") {
      setPipelineStage("PROSPECTO_PROPIETARIO");
    } else if (type === "ALQUILERES") {
      setPipelineStage("SOLICITUD_RENTA");
    } else {
      setPipelineStage("NUEVO");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || !phoneNumber.trim()) return;

    const matchedProperty = properties.find((p) => p.id === selectedPropertyId);
    const leadType: LeadType = 
      pipelineType === "CAPTACIONES" ? "SELLER_OWNER" : 
      pipelineType === "ALQUILERES" ? "TENANT" : "BUYER";

    const budgetNum = typeof budgetMaxUsd === "number" ? budgetMaxUsd : 0;
    const downPaymentNum = typeof downPaymentPercent === "number" ? downPaymentPercent : 0;

    const defaultSummary = 
      pipelineType === "CAPTACIONES" 
        ? `Propietario interesado en consignar inmueble${preferredZone ? ` en ${preferredZone}` : ""}${budgetNum > 0 ? ` valorado en $${budgetNum.toLocaleString()} USD.` : "."}`
        : pipelineType === "ALQUILERES"
        ? `Inquilino buscando alquiler${preferredZone ? ` en ${preferredZone}` : ""}${budgetNum > 0 ? ` con presupuesto de $${budgetNum.toLocaleString()} USD/mes.` : "."}`
        : `Lead comprador.${budgetNum > 0 ? ` Presupuesto $${budgetNum.toLocaleString()} USD` : ""}${preferredZone ? ` en ${preferredZone}.` : "."}`;

    // Score calculado de forma real según información realmente suministrada
    let calculatedScore = 20; // Base por contacto
    if (budgetNum > 0) calculatedScore += 30;
    if (preferredZone) calculatedScore += 20;
    if (hasDownPayment && downPaymentNum > 0) calculatedScore += 20;

    // Normalización E.164 del teléfono (CRM-04)
    const rawDigits = phoneNumber.replace(/\D/g, "");
    const cleanPhone = rawDigits.startsWith("591") 
      ? `+591 ${rawDigits.slice(3)}` 
      : rawDigits.length === 8 
      ? `+591 ${rawDigits}` 
      : phoneNumber.trim();

    const newLead: Lead = {
      id: `lead-${Date.now()}`,
      organizationId: "org-1",
      fullName: fullName.trim(),
      phoneNumber: cleanPhone,
      pipelineType,
      leadType,
      pipelineStage,
      budgetMaxUsd: budgetNum,
      paymentMethod,
      hasDownPayment: pipelineType === "VENTAS" ? hasDownPayment : false,
      downPaymentPercent: downPaymentNum,
      downPaymentBank: downPaymentBank.trim() || undefined,
      preferredZone: preferredZone.trim(),
      propertyInterestId: selectedPropertyId || undefined,
      matchedProperty: pipelineType !== "CAPTACIONES" ? matchedProperty : undefined,
      aiSummary: aiSummary.trim() || defaultSummary,
      aiPaused: false,
      intentScore: calculatedScore,
      createdAt: "Ahora mismo",
    };

    onAddLead(newLead);
    onClose();
    
    // Reset fields
    setFullName("");
    setPhoneNumber("+591 ");
    setBudgetMaxUsd("");
    setPaymentMethod("POR_DEFINIR");
    setHasDownPayment(false);
    setDownPaymentPercent("");
    setDownPaymentBank("");
    setPreferredZone("");
    setSelectedPropertyId("");
    setAiSummary("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-4 max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">+ Registrar Nuevo Lead / Contacto</h3>
              <p className="text-xs text-slate-500">Asignación inmediata al Embudo correspondiente</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* SELECTOR DE TIPO DE EMBUDO */}
        <div>
          <label className="block font-bold text-slate-700 mb-1.5 text-xs">Tipo de Operación / Embudo *</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handlePipelineTypeChange("VENTAS")}
              className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                pipelineType === "VENTAS"
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Building className={`w-4 h-4 ${pipelineType === "VENTAS" ? "text-emerald-400" : "text-slate-400"}`} />
              <div>
                <p className="text-xs font-bold leading-none">Ventas</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Comprador</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handlePipelineTypeChange("CAPTACIONES")}
              className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                pipelineType === "CAPTACIONES"
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <FileText className={`w-4 h-4 ${pipelineType === "CAPTACIONES" ? "text-emerald-400" : "text-slate-400"}`} />
              <div>
                <p className="text-xs font-bold leading-none">Captación</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Propietario</p>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handlePipelineTypeChange("ALQUILERES")}
              className={`p-2.5 rounded-xl border text-left transition flex items-center gap-2 ${
                pipelineType === "ALQUILERES"
                  ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                  : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <Key className={`w-4 h-4 ${pipelineType === "ALQUILERES" ? "text-emerald-400" : "text-slate-400"}`} />
              <div>
                <p className="text-xs font-bold leading-none">Alquileres</p>
                <p className="text-[10px] text-slate-400 mt-0.5">Inquilino</p>
              </div>
            </button>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {pipelineType === "CAPTACIONES" ? "Nombre del Propietario *" : "Nombre Completo del Cliente *"}
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="ej. Carlos Justiniano"
                className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">WhatsApp / Teléfono *</label>
              <input
                type="text"
                required
                value={phoneNumber}
                onChange={(e) => handlePhoneChange(e.target.value)}
                placeholder="+591 71234567"
                className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-mono text-xs"
              />
            </div>
          </div>

          {/* Banner de Advertencia de Prospecto Duplicado (CRM-04) */}
          {duplicateWarning && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs text-amber-900 animate-in fade-in">
              <div className="flex items-center gap-2">
                <span className="text-base">⚠️</span>
                <div>
                  <p className="font-bold">Número ya registrado con "{duplicateWarning.fullName}"</p>
                  <p className="text-[11px] text-amber-700">Etapa: {duplicateWarning.pipelineStage} · Evita duplicar el historial.</p>
                </div>
              </div>
              {onOpenExistingLead && (
                <button
                  type="button"
                  onClick={() => {
                    onOpenExistingLead(duplicateWarning);
                    onClose();
                  }}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-[10px] transition shrink-0"
                >
                  Abrir Lead
                </button>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {pipelineType === "CAPTACIONES" 
                  ? "Valor Estimado del Inmueble (USD)" 
                  : pipelineType === "ALQUILERES"
                  ? "Presupuesto Mensual Renta (USD)"
                  : "Presupuesto Máximo Compra (USD)"}
              </label>
              <input
                type="number"
                value={budgetMaxUsd}
                onChange={(e) => setBudgetMaxUsd(e.target.value === "" ? "" : Number(e.target.value))}
                placeholder={pipelineType === "ALQUILERES" ? "ej. 650" : "ej. 85000"}
                className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-bold text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {pipelineType === "CAPTACIONES" ? "Modalidad de Consignación" : "Modalidad de Pago / Finanzas"}
              </label>
              {pipelineType === "CAPTACIONES" ? (
                <select
                  value="EXCLUSIVA"
                  onChange={() => {}}
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-semibold text-xs"
                >
                  <option value="EXCLUSIVA">Contrato en Exclusiva (Comisión 4%)</option>
                  <option value="ABIERTA">Consignación Abierta (Comisión 3%)</option>
                </select>
              ) : pipelineType === "ALQUILERES" ? (
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-semibold text-xs"
                >
                  <option value="POR_DEFINIR">-- Por Definir --</option>
                  <option value="CONTADO">Garantía + Mes Adelantado</option>
                  <option value="CREDITO_BANCARIO">Póliza de Arrendamiento</option>
                </select>
              ) : (
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-semibold text-xs"
                >
                  <option value="POR_DEFINIR">-- Por Definir --</option>
                  <option value="CREDITO_VIS">Crédito VIS (Vivienda Social ASFI)</option>
                  <option value="CREDITO_BANCARIO">Crédito Bancario Tradicional</option>
                  <option value="CONTADO">Pago al Contado</option>
                </select>
              )}
            </div>
          </div>

          {/* Validación de Cuota Inicial solo en Ventas */}
          {pipelineType === "VENTAS" && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Validación de Cuota Inicial / Aporte Propio
                </span>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasDownPayment}
                    onChange={(e) => setHasDownPayment(e.target.checked)}
                    className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="font-bold text-slate-700">Aporte Propio Confirmado</span>
                </label>
              </div>

              {hasDownPayment && (
                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-slate-600 text-[11px] font-medium mb-1">% Cuota Inicial</label>
                    <input
                      type="number"
                      value={downPaymentPercent}
                      onChange={(e) => setDownPaymentPercent(e.target.value === "" ? "" : Number(e.target.value))}
                      placeholder="ej. 15"
                      className="w-full p-2 border border-slate-200 rounded-lg text-slate-900 font-bold text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-600 text-[11px] font-medium mb-1">Banco de Preferencia</label>
                    <input
                      type="text"
                      value={downPaymentBank}
                      onChange={(e) => setDownPaymentBank(e.target.value)}
                      placeholder="ej. Banco BCP, Mercantil Santa Cruz, BNB"
                      className="w-full p-2 border border-slate-200 rounded-lg text-slate-900 text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {pipelineType === "CAPTACIONES" ? "Zona / Ubicación del Inmueble" : "Zona / Ciudad Preferida"}
              </label>
              <input
                type="text"
                value={preferredZone}
                onChange={(e) => setPreferredZone(e.target.value)}
                placeholder="ej. Equipetrol, Sopocachi, Calacoto, Urubó"
                className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Etapa Inicial del Embudo</label>
              <select
                value={pipelineStage}
                onChange={(e) => setPipelineStage(e.target.value as PipelineStage)}
                className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 text-xs font-semibold"
              >
                {pipelineType === "CAPTACIONES" ? (
                  <>
                    <option value="PROSPECTO_PROPIETARIO">DUEÑO PROSPECTO</option>
                    <option value="EVALUACION_INMUEBLE">INSPECCIÓN / VALÚO</option>
                    <option value="ACM_ESTUDIO_MERCADO">ESTUDIO ACM</option>
                    <option value="AUDITORIA_DOCUMENTAL">AUDITORÍA LEGAL</option>
                    <option value="CONTRATO_CONSIGNACION">CONTRATO EXCLUSIVA</option>
                  </>
                ) : pipelineType === "ALQUILERES" ? (
                  <>
                    <option value="SOLICITUD_RENTA">SOLICITUD RENTA</option>
                    <option value="PERFILAMIENTO_INGRESOS">PERFILAMIENTO</option>
                    <option value="VISITA_RENTA">VISITA INMUEBLE</option>
                    <option value="REVISION_GARANTIAS">DEPÓSITO & PÓLIZA</option>
                  </>
                ) : (
                  <>
                    <option value="NUEVO">NUEVO</option>
                    <option value="EN_CALIFICACION">EN CALIFICACIÓN</option>
                    <option value="CALIFICADO_VISITA_PENDIENTE">CALIFICADO - CITA PENDIENTE</option>
                    <option value="VISITA_AGENDADA">AGENDA</option>
                    <option value="VISITA_REALIZADA">VISITA REALIZADA</option>
                    <option value="EN_NEGOCIACION">EN NEGOCIACIÓN</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {pipelineType !== "CAPTACIONES" && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">Inmueble de Interés del Inventario RAG</label>
              <select
                value={selectedPropertyId}
                onChange={(e) => setSelectedPropertyId(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 font-medium text-xs"
              >
                <option value="">-- Ninguno / Por Definir --</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title} — ${(p.priceUsd ?? 0).toLocaleString()} USD ({p.zone}, {p.city})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">Nota / Diagnóstico del Agente IA</label>
            <textarea
              rows={2}
              value={aiSummary}
              onChange={(e) => setAiSummary(e.target.value)}
              placeholder="Detalle de preferencias, características del inmueble o notas de WhatsApp..."
              className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 text-xs"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Guardar en {pipelineType === "CAPTACIONES" ? "Captaciones" : pipelineType === "ALQUILERES" ? "Alquileres" : "Ventas"}</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
