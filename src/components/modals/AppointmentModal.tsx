import React, { useState } from "react";
import { 
  X, 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  CheckCircle2, 
  ExternalLink, 
  Sparkles,
  Download,
  Share2,
  Copy,
  Check
} from "lucide-react";
import { Lead } from "@/src/types/property";
import { 
  generateGoogleCalendarUrl, 
  generateOutlookCalendarUrl, 
  downloadIcsFile, 
  generateAppointmentWhatsAppMessage,
  CalendarEventData
} from "@/src/utils/calendarHelper";

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
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [agent, setAgent] = useState("Sofía / Agente Ejecutivo Property OS");
  const [location, setLocation] = useState(
    lead.matchedProperty?.zone 
      ? `${lead.matchedProperty.title} - ${lead.matchedProperty.zone}, ${lead.matchedProperty.city}` 
      : `${lead.preferredZone || 'Equipetrol'}, Santa Cruz`
  );
  const [notes, setNotes] = useState(
    `Visita guiada para ${lead.fullName} en ${lead.matchedProperty?.title || 'Inmueble seleccionado'}. Revisión de ambientes y factibilidad financiera.`
  );
  const [syncGoogleCalendar, setSyncGoogleCalendar] = useState(true);
  const [copiedToast, setCopiedToast] = useState(false);

  const getEventData = (): CalendarEventData => {
    const startDateTime = new Date(`${date}T${time}:00`);
    return {
      title: `Visita Inmueble: ${lead.fullName} (${lead.matchedProperty?.title || 'Property OS'})`,
      description: `👤 Cliente: ${lead.fullName}\n📞 Teléfono: ${lead.phoneNumber}\n💰 Presupuesto: $${(lead.budgetMaxUsd ?? 0).toLocaleString()} USD\n💳 Modalidad: ${lead.paymentMethod}\n🏢 Inmueble: ${lead.matchedProperty?.title || 'General'}\n📝 Notas: ${notes}\n\nAgendado vía Property OS System`,
      location: location,
      startDate: isNaN(startDateTime.getTime()) ? new Date() : startDateTime,
      durationMinutes,
      clientName: lead.fullName,
      clientPhone: lead.phoneNumber,
      propertyTitle: lead.matchedProperty?.title,
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onConfirmAppointment(lead.id, { date, time, agent, notes });

    if (syncGoogleCalendar) {
      const eventData = getEventData();
      const googleUrl = generateGoogleCalendarUrl(eventData);
      window.open(googleUrl, "_blank");
    }

    onClose();
  };

  const handleDownloadIcs = () => {
    const eventData = getEventData();
    downloadIcsFile(eventData, `visita-${lead.fullName.toLowerCase().replace(/\s+/g, '-')}.ics`);
  };

  const handleSendWhatsAppConfirmation = () => {
    const eventData = getEventData();
    const message = generateAppointmentWhatsAppMessage(eventData);
    const phone = lead.phoneNumber.replace(/\D/g, "");
    const url = phone 
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(message)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const handleCopyMessage = () => {
    const eventData = getEventData();
    const message = generateAppointmentWhatsAppMessage(eventData);
    navigator.clipboard.writeText(message);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in zoom-in-95 space-y-4 my-auto max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center font-bold shadow-md shadow-slate-900/10">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-slate-900">Agendar Visita Inmobiliaria</h3>
                <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                  Google Calendar Sync
                </span>
              </div>
              <p className="text-xs text-slate-500">Sincronización multi-plataforma y confirmación por WhatsApp</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Lead Context Summary */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
          <div>
            <p className="font-extrabold text-slate-900">{lead.fullName}</p>
            <p className="text-slate-500 text-[11px] font-mono">{lead.phoneNumber} • {lead.preferredZone}</p>
          </div>
          <div className="text-right">
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-lg text-[11px] block">
              ${(lead.budgetMaxUsd ?? 0).toLocaleString()} USD
            </span>
            <span className="text-[10px] text-slate-400 font-medium">Presupuesto BANT</span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Fecha de la Cita *</label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 text-xs font-semibold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Hora de Inicio *</label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 text-xs font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Duración Estimada</label>
              <select
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(Number(e.target.value))}
                className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 text-xs font-semibold cursor-pointer"
              >
                <option value={30}>30 minutos (Express)</option>
                <option value={45}>45 minutos (Estándar)</option>
                <option value={60}>1 hora (Completa)</option>
                <option value={90}>1 hora 30 min</option>
              </select>
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
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Ubicación / Punto de Encuentro</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 text-xs font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Notas de la Cita / Indicaciones</label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 text-xs"
            />
          </div>

          {/* Sync Checkbox Card */}
          <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-2xl flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="syncCal"
                checked={syncGoogleCalendar}
                onChange={(e) => setSyncGoogleCalendar(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
              />
              <label htmlFor="syncCal" className="font-bold text-blue-950 cursor-pointer text-xs">
                Sincronizar y abrir evento en Google Calendar automáticamente
              </label>
            </div>
            <ExternalLink className="w-4 h-4 text-blue-600" />
          </div>

          {/* Acciones Adicionales de Calendario & WhatsApp */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button
              type="button"
              onClick={handleSendWhatsAppConfirmation}
              className="py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 font-bold text-[11px] flex items-center justify-center gap-1.5 transition"
            >
              <Share2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Enviar Enlace por WhatsApp</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadIcs}
              className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold text-[11px] flex items-center justify-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Descargar Archivo .ICS</span>
            </button>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-between items-center pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleCopyMessage}
              className="text-slate-500 hover:text-slate-800 text-xs font-bold flex items-center gap-1"
            >
              {copiedToast ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedToast ? "¡Mensaje copiado!" : "Copiar texto"}</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-100 transition-colors"
              >
                Cerrar
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
              >
                <Sparkles className="w-4 h-4 text-emerald-400" />
                <span>Confirmar Cita & Agendar</span>
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
