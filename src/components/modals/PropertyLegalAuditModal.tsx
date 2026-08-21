import React, { useState, useEffect } from "react";
import { 
  X, 
  ShieldCheck, 
  ShieldAlert, 
  ShieldX, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Save, 
  Sparkles,
  Building,
  MapPin,
  Clock
} from "lucide-react";
import { Property, PropertyLegalAudit } from "@/src/types/property";
import { supabase } from "@/src/lib/supabase";

interface PropertyLegalAuditModalProps {
  isOpen: boolean;
  property: Property | null;
  onClose: () => void;
  onAuditUpdated?: (propertyId: string, updatedAudit: PropertyLegalAudit) => void;
}

export const PropertyLegalAuditModal: React.FC<PropertyLegalAuditModalProps> = ({
  isOpen,
  property,
  onClose,
  onAuditUpdated,
}) => {
  if (!isOpen || !property) return null;

  const [folioRealStatus, setFolioRealStatus] = useState<PropertyLegalAudit['folioRealStatus']>(
    property.legalAudit?.folioRealStatus || 'PENDIENTE'
  );
  const [taxStatus, setTaxStatus] = useState<PropertyLegalAudit['taxStatus']>(
    property.legalAudit?.taxStatus || 'PENDIENTE'
  );
  const [cadastralStatus, setCadastralStatus] = useState<PropertyLegalAudit['cadastralStatus']>(
    property.legalAudit?.cadastralStatus || 'PENDIENTE'
  );
  const [notes, setNotes] = useState<string>(property.legalAudit?.notes || '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    if (property) {
      setFolioRealStatus(property.legalAudit?.folioRealStatus || 'PENDIENTE');
      setTaxStatus(property.legalAudit?.taxStatus || 'PENDIENTE');
      setCadastralStatus(property.legalAudit?.cadastralStatus || 'PENDIENTE');
      setNotes(property.legalAudit?.notes || '');
      setSaveMessage(null);
    }
  }, [property]);

  // Cálculo algorítmico del semáforo de viabilidad legal
  const computeGlobalScore = (): 'VERDE' | 'AMARILLO' | 'ROJO' => {
    if (folioRealStatus === 'AL_DIA' && taxStatus === 'AL_DIA' && cadastralStatus === 'APROBADO') {
      return 'VERDE';
    }
    if (cadastralStatus === 'NO_TIENE') {
      return 'ROJO';
    }
    if (
      folioRealStatus === 'CON_GRAVAMEN' || 
      taxStatus === 'DEUDA' || 
      cadastralStatus === 'EN_TRAMITE' ||
      folioRealStatus === 'PENDIENTE' ||
      taxStatus === 'PENDIENTE' ||
      cadastralStatus === 'PENDIENTE'
    ) {
      return 'AMARILLO';
    }
    return 'ROJO';
  };

  const computedScore = computeGlobalScore();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveMessage(null);

    const score = computeGlobalScore();

    try {
      const payload = {
        property_id: property.id,
        city: property.city || 'Santa Cruz',
        folio_real_status: folioRealStatus,
        tax_status: taxStatus,
        cadastral_status: cadastralStatus,
        global_legal_score: score,
        notes,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = await supabase
        .from('property_legal_audit')
        .upsert(payload, { onConflict: 'property_id' })
        .select('*')
        .single();

      if (error) {
        console.error('Error guardando auditoría legal:', error);
        setSaveMessage('❌ Error al guardar en base de datos.');
      } else {
        const updatedAudit: PropertyLegalAudit = {
          id: data.id,
          propertyId: property.id,
          city: data.city,
          folioRealStatus: data.folio_real_status,
          taxStatus: data.tax_status,
          cadastralStatus: data.cadastral_status,
          globalLegalScore: data.global_legal_score,
          notes: data.notes || '',
          updatedAt: data.updated_at,
        };

        if (onAuditUpdated) {
          onAuditUpdated(property.id, updatedAudit);
        }

        setSaveMessage('✅ Auditoría Legal guardada con éxito.');
        setTimeout(() => {
          onClose();
        }, 1200);
      }
    } catch (err) {
      console.error('Error inesperado:', err);
      setSaveMessage('❌ Error de conexión.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 my-auto animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white shadow-sm ${
              computedScore === 'VERDE' ? 'bg-emerald-600' : computedScore === 'AMARILLO' ? 'bg-amber-500' : 'bg-rose-600'
            }`}>
              {computedScore === 'VERDE' ? <ShieldCheck className="w-5 h-5" /> : computedScore === 'AMARILLO' ? <ShieldAlert className="w-5 h-5" /> : <ShieldX className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Checklist de Auditoría Legal Inmobiliaria</h3>
              <p className="text-xs text-slate-500">Validación de Derechos Reales, Impuestos y Catastro Municipal</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Property Summary Card */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 bg-slate-200 rounded-lg overflow-hidden shrink-0 border border-slate-300">
              <img 
                src={(property.imageUrl || "").split(',')[0]?.trim() || "https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?w=600&auto=format&fit=crop&q=80"} 
                alt={property.title} 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <h4 className="text-xs font-bold text-slate-900 truncate">{property.title}</h4>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span>{property.zone}, {property.city}</span>
              </div>
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="text-xs font-bold text-slate-900">${(property.priceUsd ?? 0).toLocaleString()} USD</div>
            <div className="text-[10px] text-emerald-600 font-semibold">{property.acceptsSocialHousing ? "Apto VIS" : "Venta Bancaria"}</div>
          </div>
        </div>

        {/* Formulario de Checklist Documental */}
        <form onSubmit={handleSave} className="space-y-4 text-xs">
          
          {/* 1. Folio Real (DDRR) */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>1. Folio Real (Derechos Reales - DDRR)</span>
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Gravámenes e Hipotecas</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setFolioRealStatus('AL_DIA')}
                className={`py-2 px-3 rounded-lg border font-bold text-[11px] transition-all ${
                  folioRealStatus === 'AL_DIA'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                ✅ Al Día (Limpio)
              </button>
              <button
                type="button"
                onClick={() => setFolioRealStatus('CON_GRAVAMEN')}
                className={`py-2 px-3 rounded-lg border font-bold text-[11px] transition-all ${
                  folioRealStatus === 'CON_GRAVAMEN'
                    ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                ⚠️ Con Gravamen
              </button>
              <button
                type="button"
                onClick={() => setFolioRealStatus('PENDIENTE')}
                className={`py-2 px-3 rounded-lg border font-bold text-[11px] transition-all ${
                  folioRealStatus === 'PENDIENTE'
                    ? 'bg-slate-200 border-slate-400 text-slate-800 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                🔍 Pendiente
              </button>
            </div>
          </div>

          {/* 2. Impuestos Municipales */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>2. Impuestos Municipales (RUAT / Alcaldía)</span>
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Última Gestión Fiscal</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTaxStatus('AL_DIA')}
                className={`py-2 px-3 rounded-lg border font-bold text-[11px] transition-all ${
                  taxStatus === 'AL_DIA'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                ✅ Pagado al Día
              </button>
              <button
                type="button"
                onClick={() => setTaxStatus('DEUDA')}
                className={`py-2 px-3 rounded-lg border font-bold text-[11px] transition-all ${
                  taxStatus === 'DEUDA'
                    ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                ❌ Con Deuda
              </button>
              <button
                type="button"
                onClick={() => setTaxStatus('PENDIENTE')}
                className={`py-2 px-3 rounded-lg border font-bold text-[11px] transition-all ${
                  taxStatus === 'PENDIENTE'
                    ? 'bg-slate-200 border-slate-400 text-slate-800 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                🔍 Pendiente
              </button>
            </div>
          </div>

          {/* 3. Catastro Municipal */}
          <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-2">
            <div className="flex justify-between items-center">
              <label className="font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-purple-600" />
                <span>3. Plano de Uso de Suelo & Catastro</span>
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Visación Municipal</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              <button
                type="button"
                onClick={() => setCadastralStatus('APROBADO')}
                className={`py-2 px-2 rounded-lg border font-bold text-[10px] transition-all ${
                  cadastralStatus === 'APROBADO'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                ✅ Aprobado
              </button>
              <button
                type="button"
                onClick={() => setCadastralStatus('EN_TRAMITE')}
                className={`py-2 px-2 rounded-lg border font-bold text-[10px] transition-all ${
                  cadastralStatus === 'EN_TRAMITE'
                    ? 'bg-amber-50 border-amber-500 text-amber-700 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                ⚠️ Trámite
              </button>
              <button
                type="button"
                onClick={() => setCadastralStatus('NO_TIENE')}
                className={`py-2 px-2 rounded-lg border font-bold text-[10px] transition-all ${
                  cadastralStatus === 'NO_TIENE'
                    ? 'bg-rose-50 border-rose-500 text-rose-700 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                ❌ No Tiene
              </button>
              <button
                type="button"
                onClick={() => setCadastralStatus('PENDIENTE')}
                className={`py-2 px-2 rounded-lg border font-bold text-[10px] transition-all ${
                  cadastralStatus === 'PENDIENTE'
                    ? 'bg-slate-200 border-slate-400 text-slate-800 shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                🔍 Pendiente
              </button>
            </div>
          </div>

          {/* Notas u Observaciones */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Notas de Auditoría / Gravámenes a Subsanar</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detalles sobre entidad bancaria acreedora, trámite notarial o minuta de cancelación..."
              className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-xs bg-slate-50"
            />
          </div>

          {/* Diagnóstico Semáforo en Tiempo Real */}
          <div className={`p-3 rounded-xl border flex items-center justify-between ${
            computedScore === 'VERDE'
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              : computedScore === 'AMARILLO'
              ? 'bg-amber-50/80 border-amber-200 text-amber-900'
              : 'bg-rose-50/80 border-rose-200 text-rose-900'
          }`}>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold">
                {computedScore === 'VERDE' ? '🟢 SEMÁFORO VERDE' : computedScore === 'AMARILLO' ? '🟡 SEMÁFORO AMARILLO' : '🔴 SEMÁFORO ROJO'}
              </span>
            </div>
            <span className="text-[11px] font-semibold">
              {computedScore === 'VERDE'
                ? 'Inmueble 100% Viable para Venta & VIS'
                : computedScore === 'AMARILLO'
                ? 'Requiere Subsanación Previa'
                : 'Inmueble Bloqueado para Publicación'}
            </span>
          </div>

          {saveMessage && (
            <div className="text-center font-bold text-xs py-1">
              {saveMessage}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-100"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 flex items-center gap-1.5 shadow-md disabled:opacity-50"
            >
              <Save className="w-4 h-4 text-emerald-400" />
              <span>{isSaving ? "Guardando..." : "Guardar Dictamen Legal"}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
