import React, { useState } from "react";
import { X, Calendar, Clock, MapPin, User, CheckCircle2, ExternalLink, Sparkles } from "lucide-react";
import { Lead } from "@/src/types/property";

interface AppointmentModalProps {
  isOpen: boolean;
  lead: Lead | null;
  onClose: () => void;
  onConfirmAppointment: (leadId: string, appointmentDetails: { date: string; time: string; agent: string; notes: string }) => void;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  lead,
  onClose,
  onConfirmAppointment,
}) => {
  if (!isOpen || !lead) return null;

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const defaultDate = tomorrow.toISOString().split("T")[0];

  const [date, setDate] = useState(defaultDate);
  const [time, setTime] = useState("10:00");
  const [agent, setAgent] = useState("Sofía / Agente Ejecutivo Remax");
  const [notes, setNotes] = useState(`Visita guiada para ${lead.fullName} en ${lead.matchedProperty?.title || 'Smart Tower 2D'}. Verificación de parqueo y acabados.`);
  const [syncCalendar, setSyncCalendar] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onConfirmAppointment(lead.id, { date, time, agent, notes });

    if (syncCalendar) {
      const title = encodeURIComponent(`Visita Property OS: ${lead.fullName} - ${lead.matchedProperty?.title || 'Smart Tower 2D'}`);
      const details = encodeURIComponent(`Cliente: ${lead.fullName}\nTeléfono: ${lead.phoneNumber}\nPresupuesto: $${(lead.budgetMaxUsd ?? 0).toLocaleString()} USD\nForma de Pago: ${lead.paymentMethod}\nNotas: ${notes}`);
      const location = encodeURIComponent(`${lead.matchedProperty?.zone || 'Equipetrol Norte'}, Santa Cruz`);
      const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
      
      window.open(calendarUrl, "_blank");
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-4">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-emerald-400 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Agendar Visita Inmobiliaria</h3>
              <p className="text-xs text-slate-500">Sincronización directa con Google Calendar & WhatsApp</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lead Context Summary */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
          <div>
            <p className="font-bold text-slate-900">{lead.fullName}</p>
            <p className="text-slate-500">{lead.phoneNumber} • {lead.preferredZone}</p>
          </div>
          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[11px]">
            ${(lead.budgetMaxUsd ?? 0).toLocaleString()} USD
          </span>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Fecha de Visita</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Hora de Cita</label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 text-xs font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Agente Asignado</label>
            <input
              type="text"
              value={agent}
              onChange={(e) => setAgent(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 text-xs font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Notas de la Cita / Indicaciones</label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 text-xs"
            />
          </div>

          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="syncCal"
                checked={syncCalendar}
                onChange={(e) => setSyncCalendar(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
              />
              <label htmlFor="syncCal" className="font-bold text-emerald-950 cursor-pointer">
                Abrir evento en Google Calendar al confirmar
              </label>
            </div>
            <ExternalLink className="w-4 h-4 text-emerald-600" />
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
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Confirmar Cita & Mover a Visita</span>
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
