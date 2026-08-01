import React from "react";
import { X, Printer, Download, Building2, CheckCircle2, ShieldCheck, FileText } from "lucide-react";
import { Lead } from "@/src/types/property";

interface PdfFichaModalProps {
  isOpen: boolean;
  lead: Lead | null;
  onClose: () => void;
}

export const PdfFichaModal: React.FC<PdfFichaModalProps> = ({
  isOpen,
  lead,
  onClose,
}) => {
  if (!isOpen || !lead) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-8 shadow-2xl border border-slate-200 space-y-6 my-auto print:p-0 print:shadow-none">
        
        {/* Printable Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-extrabold text-2xl">
              P
            </div>
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-slate-900">PROPERTY OS</h2>
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Ficha de Calificación Financiera & Pre-Reserva</p>
            </div>
          </div>

          <div className="text-right print:hidden">
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Voucher Content */}
        <div className="space-y-5 text-sm">
          
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Titular del Lead</span>
              <p className="font-extrabold text-slate-900 text-base mt-0.5">{lead.fullName}</p>
              <p className="text-xs text-slate-600 font-mono">{lead.phoneNumber}</p>
            </div>

            <div className="text-right">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Score Calificación RAG</span>
              <p className="font-extrabold text-emerald-600 text-xl mt-0.5">{lead.intentScore} / 100 🔥</p>
              <span className="text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold">Apto Crédito ASFI</span>
            </div>
          </div>

          {/* Details Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <tbody className="divide-y divide-slate-200">
                <tr className="bg-slate-100/50">
                  <td className="p-3 font-bold text-slate-700 w-1/3">Inmueble Seleccionado</td>
                  <td className="p-3 font-bold text-slate-900">{lead.matchedProperty?.title || 'Smart Tower 2D'}</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-slate-700">Ubicación / Zona</td>
                  <td className="p-3 text-slate-800">{lead.matchedProperty?.zone || 'Equipetrol Norte'}, Santa Cruz</td>
                </tr>
                <tr className="bg-slate-100/50">
                  <td className="p-3 font-bold text-slate-700">Presupuesto Aprobado</td>
                  <td className="p-3 font-extrabold text-slate-900">${lead.budgetMaxUsd.toLocaleString()} USD</td>
                </tr>
                <tr>
                  <td className="p-3 font-bold text-slate-700">Modalidad Financiera</td>
                  <td className="p-3 font-bold text-emerald-700">
                    {lead.paymentMethod === 'CREDITO_VIS' ? 'Crédito Vivienda Social (ASFI)' : lead.paymentMethod}
                  </td>
                </tr>
                <tr className="bg-slate-100/50">
                  <td className="p-3 font-bold text-slate-700">Aporte Propio (Cuota Inicial)</td>
                  <td className="p-3 text-slate-900">
                    {lead.hasDownPayment ? `VERIFICADO ${lead.downPaymentPercent}% (${lead.downPaymentBank || 'Banco BCP'})` : 'En proceso'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Diagnostico Sofía */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
            <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              Dictamen Automatizado Agente IA Sofía
            </h4>
            <p className="text-xs text-emerald-900 leading-relaxed italic">
              "{lead.aiSummary}"
            </p>
          </div>

          <div className="pt-4 border-t border-slate-200 text-center text-[11px] text-slate-400">
            Documento emitido por Property OS Enterprise System • Remax Fortaleza • {new Date().toLocaleDateString('es-BO')}
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2 print:hidden border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-100"
          >
            Cerrar
          </button>
          <button
            onClick={handlePrint}
            className="px-5 py-2 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 flex items-center gap-2 shadow-md"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            <span>Imprimir / Guardar PDF</span>
          </button>
        </div>

      </div>
    </div>
  );
};
