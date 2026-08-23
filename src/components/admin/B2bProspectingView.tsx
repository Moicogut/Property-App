import React, { useState, useEffect } from "react";
import {
  Search,
  Building2,
  MapPin,
  Mail,
  Phone,
  Globe,
  User,
  MessageSquare,
  Loader2,
  CheckCircle2,
  XCircle,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Send,
  Zap,
  Clock,
  Eye,
  X,
  Copy,
  Check,
  Video,
  Building,
  ChevronDown,
  Linkedin
} from "lucide-react";

export interface B2bProspect {
  id: string;
  agency_name: string;
  city: string;
  zone?: string;
  address?: string;
  website_url?: string;
  phone_official?: string;
  whatsapp_contact?: string;
  manager_name?: string;
  manager_role?: string;
  email_official?: string;
  email_personal?: string;
  linkedin_url?: string;
  enrichment_status: "PENDING" | "ENRICHED" | "FAILED";
  outreach_status: "NUEVO" | "EMAIL_ENVIADO" | "DEMO_AGENDADA" | "RECHAZADO" | "CONVERTIDO";
  last_contacted_at?: string;
  meeting_link?: string;
  notes?: string;
  created_at?: string;
}

const OUTREACH_STATUS_CONFIG: Record<B2bProspect["outreach_status"], { label: string; color: string; bg: string }> = {
  NUEVO: { label: "Nuevo", color: "text-slate-300", bg: "bg-slate-800" },
  EMAIL_ENVIADO: { label: "Email Enviado", color: "text-blue-300", bg: "bg-blue-950/60" },
  DEMO_AGENDADA: { label: "Demo Agendada", color: "text-amber-300", bg: "bg-amber-950/60" },
  RECHAZADO: { label: "Rechazado", color: "text-rose-300", bg: "bg-rose-950/60" },
  CONVERTIDO: { label: "✅ Convertido", color: "text-emerald-300", bg: "bg-emerald-950/60" },
};

const BOLIVIAN_CITIES = ["Santa Cruz", "La Paz", "Cochabamba", "Oruro", "Potosí", "Sucre", "Trinidad", "Tarija"];

export const B2bProspectingView: React.FC = () => {
  const [city, setCity] = useState("Santa Cruz");
  const [prospectCount, setProspectCount] = useState(10);
  const [prospects, setProspects] = useState<B2bProspect[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal: Ver Detalle / Generar Invitación
  const [selectedProspect, setSelectedProspect] = useState<B2bProspect | null>(null);
  const [modalMode, setModalMode] = useState<"detail" | "invitation">("detail");

  // Estado de la Invitación Generada
  const [meetingType, setMeetingType] = useState<"meet" | "zoom">("meet");
  const [proposedDate, setProposedDate] = useState("el próximo martes a las 10:00 AM");
  const [customMessage, setCustomMessage] = useState("");
  const [isGeneratingInvitation, setIsGeneratingInvitation] = useState(false);
  const [generatedInvitation, setGeneratedInvitation] = useState<{
    subject: string;
    html_body: string;
    plain_text: string;
    meeting_link: string;
    to: string;
  } | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Estado de Conversión
  const [isConverting, setIsConverting] = useState<string | null>(null);

  const handleScan = async () => {
    setIsScanning(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await fetch("/api/admin/b2b", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "search", city, country: "Bolivia", limit: prospectCount }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al escanear");
      setProspects(data.prospects || []);
      setSuccessMessage(`✅ ${data.total} agencias inmobiliarias detectadas en ${city}`);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error al escanear agencias");
    } finally {
      setIsScanning(false);
    }
  };

  const handleGenerateInvitation = async () => {
    if (!selectedProspect) return;
    setIsGeneratingInvitation(true);
    setGeneratedInvitation(null);
    try {
      const res = await fetch("/api/admin/b2b", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "invite",
          prospectId: selectedProspect.id || "local",
          agencyName: selectedProspect.agency_name,
          managerName: selectedProspect.manager_name || "Gerente",
          emailOfficial: selectedProspect.email_official,
          emailPersonal: selectedProspect.email_personal,
          city: selectedProspect.city,
          meetingType,
          proposedDate,
          customMessage,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error generando invitación");
      setGeneratedInvitation(data);

      // Actualizar el estado local del prospecto
      setProspects((prev) =>
        prev.map((p) =>
          p.id === selectedProspect.id
            ? { ...p, outreach_status: "EMAIL_ENVIADO", meeting_link: data.meeting_link }
            : p
        )
      );
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error generando invitación");
    } finally {
      setIsGeneratingInvitation(false);
    }
  };

  const handleConvertToTenant = async (prospect: B2bProspect) => {
    if (!prospect.id) return;
    setIsConverting(prospect.id);
    setErrorMessage(null);
    try {
      const res = await fetch("/api/admin/b2b", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "convert", prospectId: prospect.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error convirtiendo prospecto");
      setProspects((prev) =>
        prev.map((p) => (p.id === prospect.id ? { ...p, outreach_status: "CONVERTIDO" } : p))
      );
      setSuccessMessage(`✅ ${prospect.agency_name} convertida a inmobiliaria activa — Org ID: ${data.organization?.id}`);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error convirtiendo prospecto");
    } finally {
      setIsConverting(null);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const openDetailModal = (prospect: B2bProspect, mode: "detail" | "invitation" = "detail") => {
    setSelectedProspect(prospect);
    setModalMode(mode);
    setGeneratedInvitation(null);
    setErrorMessage(null);
  };

  const closeModal = () => {
    setSelectedProspect(null);
    setGeneratedInvitation(null);
  };

  const statusCounts = {
    total: prospects.length,
    nuevo: prospects.filter((p) => p.outreach_status === "NUEVO").length,
    enviado: prospects.filter((p) => p.outreach_status === "EMAIL_ENVIADO").length,
    demo: prospects.filter((p) => p.outreach_status === "DEMO_AGENDADA").length,
    convertido: prospects.filter((p) => p.outreach_status === "CONVERTIDO").length,
  };

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="bg-[#0B0D12] border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-xl">
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-[#D4AF37]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <Building2 className="w-6 h-6 text-[#D4AF37]" />
              Prospección B2B — Agencias Inmobiliarias
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Descubre gerentes y brokers de agencias inmobiliarias por ciudad. Genera y envía invitaciones de demo en 1 clic.
            </p>
          </div>
          {prospects.length > 0 && (
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                { label: "Total", value: statusCounts.total, color: "text-slate-300" },
                { label: "Nuevos", value: statusCounts.nuevo, color: "text-slate-400" },
                { label: "Enviados", value: statusCounts.enviado, color: "text-blue-400" },
                { label: "Demos", value: statusCounts.demo, color: "text-amber-400" },
                { label: "Convertidos", value: statusCounts.convertido, color: "text-emerald-400" },
              ].map((stat) => (
                <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-center min-w-[60px]">
                  <div className={`font-black text-lg ${stat.color}`}>{stat.value}</div>
                  <div className="text-slate-500 text-[10px]">{stat.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── MENSAJES ── */}
      {successMessage && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center justify-between">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)}><X className="w-3.5 h-3.5" /></button>
        </div>
      )}
      {errorMessage && (
        <div className="p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-300 text-xs flex items-center justify-between">
          <span>⚠️ {errorMessage}</span>
          <button onClick={() => setErrorMessage(null)}><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* ── PANEL DE BÚSQUEDA ── */}
      <div className="bg-[#111622] border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-bold text-[#F3E5AB]">Ciudad de Búsqueda:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
              {BOLIVIAN_CITIES.slice(0, 4).map((c) => (
                <button
                  key={c}
                  onClick={() => setCity(c)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    city === c
                      ? "bg-[#D4AF37] text-slate-950 border-[#D4AF37] font-black"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                  }`}
                >
                  📍 {c}
                </button>
              ))}
            </div>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full bg-slate-950 text-slate-200 px-3 py-2.5 rounded-xl text-xs border border-slate-800 outline-none focus:border-[#D4AF37]"
            >
              {BOLIVIAN_CITIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-300">Cantidad:</label>
            <select
              value={prospectCount}
              onChange={(e) => setProspectCount(Number(e.target.value))}
              className="w-full bg-slate-950 text-slate-200 px-3 py-2.5 rounded-xl text-xs border border-slate-800 outline-none"
            >
              <option value={5}>5 agencias</option>
              <option value={10}>10 agencias</option>
              <option value={15}>15 agencias</option>
              <option value={20}>20 agencias</option>
            </select>
          </div>

          <button
            onClick={handleScan}
            disabled={isScanning}
            className="px-6 py-3 bg-gradient-to-r from-[#D4AF37] to-[#B89628] hover:brightness-110 disabled:opacity-50 text-slate-950 font-black rounded-xl text-sm flex items-center gap-2 shadow-lg transition cursor-pointer whitespace-nowrap"
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Escaneando {city}...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>🔍 Escanear Agencias</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* ── TABLA DE PROSPECTOS ── */}
      {prospects.length > 0 && (
        <div className="bg-[#111622] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-black text-white">
              Agencias Detectadas en {city} ({prospects.length})
            </h3>
            <button
              onClick={handleScan}
              disabled={isScanning}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Actualizar</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-950/60 text-slate-400 text-[11px] uppercase">
                  <th className="text-left px-5 py-3 font-bold">Agencia / Zona</th>
                  <th className="text-left px-4 py-3 font-bold">Gerente / Cargo</th>
                  <th className="text-left px-4 py-3 font-bold">Contacto</th>
                  <th className="text-left px-4 py-3 font-bold">Estado Pipeline</th>
                  <th className="text-left px-4 py-3 font-bold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {prospects.map((prospect, idx) => {
                  const statusCfg = OUTREACH_STATUS_CONFIG[prospect.outreach_status];
                  return (
                    <tr
                      key={prospect.id || idx}
                      className="hover:bg-slate-900/40 transition group"
                    >
                      {/* Agencia / Zona */}
                      <td className="px-5 py-4">
                        <div className="font-black text-white text-[13px]">{prospect.agency_name}</div>
                        <div className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {prospect.zone || prospect.city}
                        </div>
                        {prospect.website_url && (
                          <a
                            href={prospect.website_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[11px] text-[#D4AF37] hover:underline flex items-center gap-0.5 mt-0.5"
                          >
                            <Globe className="w-2.5 h-2.5" />
                            Sitio Web
                          </a>
                        )}
                      </td>

                      {/* Gerente / Cargo */}
                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-200">{prospect.manager_name || "—"}</div>
                        <div className="text-slate-400 text-[11px]">{prospect.manager_role || "—"}</div>
                      </td>

                      {/* Contacto */}
                      <td className="px-4 py-4 space-y-1">
                        {prospect.email_official && (
                          <div className="flex items-center gap-1 text-slate-300">
                            <Mail className="w-3 h-3 text-[#D4AF37]" />
                            <span className="truncate max-w-[160px]">{prospect.email_official}</span>
                          </div>
                        )}
                        {prospect.phone_official && (
                          <div className="flex items-center gap-1 text-slate-400">
                            <Phone className="w-3 h-3" />
                            {prospect.phone_official}
                          </div>
                        )}
                        {prospect.whatsapp_contact && (
                          <a
                            href={`https://wa.me/${prospect.whatsapp_contact.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-emerald-400 hover:underline"
                          >
                            <MessageSquare className="w-3 h-3" />
                            WhatsApp
                          </a>
                        )}
                      </td>

                      {/* Estado Pipeline */}
                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-1 rounded-lg font-bold text-[11px] ${statusCfg.bg} ${statusCfg.color}`}>
                          {statusCfg.label}
                        </span>
                        {prospect.last_contacted_at && (
                          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                            <Clock className="w-2.5 h-2.5" />
                            {new Date(prospect.last_contacted_at).toLocaleDateString("es-BO")}
                          </div>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openDetailModal(prospect, "detail")}
                            title="Ver Detalles"
                            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => openDetailModal(prospect, "invitation")}
                            title="Generar Invitación de Demo"
                            disabled={prospect.outreach_status === "CONVERTIDO"}
                            className="p-1.5 bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 text-[#F3E5AB] rounded-lg border border-[#D4AF37]/40 transition cursor-pointer disabled:opacity-40"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={() => handleConvertToTenant(prospect)}
                            disabled={prospect.outreach_status === "CONVERTIDO" || isConverting === prospect.id}
                            title="Convertir a Inmobiliaria Activa"
                            className="p-1.5 bg-emerald-950/60 hover:bg-emerald-900/60 text-emerald-400 rounded-lg border border-emerald-700/40 transition cursor-pointer disabled:opacity-40"
                          >
                            {isConverting === prospect.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            ) : (
                              <Zap className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── ESTADO VACÍO ── */}
      {!isScanning && prospects.length === 0 && (
        <div className="bg-[#111622] border border-slate-800 rounded-2xl p-16 text-center">
          <Building2 className="w-14 h-14 text-slate-700 mx-auto mb-4" />
          <h3 className="text-white font-black text-lg mb-2">Sin Prospectos Aún</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Selecciona una ciudad boliviana y presiona <strong>"🔍 Escanear Agencias"</strong> para detectar gerentes y brokers de agencias inmobiliarias.
          </p>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          MODAL: DETALLE / GENERADOR DE INVITACIÓN
      ════════════════════════════════════════════════════════════════ */}
      {selectedProspect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#111622] border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800 sticky top-0 bg-[#111622] z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">{selectedProspect.agency_name}</h3>
                  <p className="text-xs text-slate-400">{selectedProspect.city} — {selectedProspect.manager_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setModalMode("detail")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${modalMode === "detail" ? "bg-[#D4AF37] text-slate-950" : "text-slate-400 hover:text-white"}`}
                >
                  Detalles
                </button>
                <button
                  onClick={() => setModalMode("invitation")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${modalMode === "invitation" ? "bg-[#D4AF37] text-slate-950" : "text-slate-400 hover:text-white"}`}
                >
                  <Sparkles className="w-3 h-3 inline mr-1" />
                  Invitación
                </button>
                <button onClick={closeModal} className="p-1.5 text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* ── MODO DETALLE ── */}
              {modalMode === "detail" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  {[
                    { label: "Agencia", value: selectedProspect.agency_name, icon: <Building2 className="w-3.5 h-3.5 text-[#D4AF37]" /> },
                    { label: "Ciudad / Zona", value: `${selectedProspect.city} — ${selectedProspect.zone || "N/A"}`, icon: <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" /> },
                    { label: "Gerente", value: selectedProspect.manager_name || "—", icon: <User className="w-3.5 h-3.5 text-[#D4AF37]" /> },
                    { label: "Cargo", value: selectedProspect.manager_role || "—", icon: <User className="w-3.5 h-3.5 text-slate-400" /> },
                    { label: "Email Oficial", value: selectedProspect.email_official || "—", icon: <Mail className="w-3.5 h-3.5 text-[#D4AF37]" /> },
                    { label: "Email Personal", value: selectedProspect.email_personal || "—", icon: <Mail className="w-3.5 h-3.5 text-slate-400" /> },
                    { label: "Teléfono Oficial", value: selectedProspect.phone_official || "—", icon: <Phone className="w-3.5 h-3.5 text-[#D4AF37]" /> },
                    { label: "WhatsApp", value: selectedProspect.whatsapp_contact || "—", icon: <MessageSquare className="w-3.5 h-3.5 text-emerald-400" /> },
                    { label: "Sitio Web", value: selectedProspect.website_url || "—", icon: <Globe className="w-3.5 h-3.5 text-[#D4AF37]" /> },
                    { label: "LinkedIn", value: selectedProspect.linkedin_url || "—", icon: <ExternalLink className="w-3.5 h-3.5 text-blue-400" /> },
                  ].map((field) => (
                    <div key={field.label} className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                      <div className="flex items-center gap-1.5 text-slate-400 mb-1">{field.icon} <span>{field.label}</span></div>
                      <div className="text-slate-200 font-medium text-[13px] break-all">{field.value}</div>
                    </div>
                  ))}
                  {selectedProspect.notes && (
                    <div className="sm:col-span-2 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                      <div className="text-slate-400 mb-1">Notas</div>
                      <div className="text-slate-300 text-[13px] leading-relaxed">{selectedProspect.notes}</div>
                    </div>
                  )}
                </div>
              )}

              {/* ── MODO INVITACIÓN ── */}
              {modalMode === "invitation" && (
                <div className="space-y-5">
                  {!generatedInvitation ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-[#F3E5AB]">Plataforma de Demo:</label>
                          <div className="flex gap-2">
                            {(["meet", "zoom"] as const).map((t) => (
                              <button
                                key={t}
                                onClick={() => setMeetingType(t)}
                                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                                  meetingType === t ? "bg-[#D4AF37] text-slate-950 border-[#D4AF37]" : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                                }`}
                              >
                                <Video className="w-3.5 h-3.5" />
                                {t === "meet" ? "Google Meet" : "Zoom"}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-300">Fecha / Hora Propuesta:</label>
                          <input
                            type="text"
                            value={proposedDate}
                            onChange={(e) => setProposedDate(e.target.value)}
                            className="w-full bg-slate-950 text-slate-200 px-3 py-2.5 rounded-xl text-xs border border-slate-800 outline-none focus:border-[#D4AF37]"
                            placeholder="ej. martes 26 de agosto a las 10:00 AM"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-300">Mensaje Adicional (Opcional):</label>
                        <textarea
                          value={customMessage}
                          onChange={(e) => setCustomMessage(e.target.value)}
                          rows={3}
                          placeholder="Ej. Mencioné que RE/MAX Bolivia tiene desafíos con la calificación de leads los fines de semana..."
                          className="w-full bg-slate-950 text-slate-200 px-3 py-2.5 rounded-xl text-xs border border-slate-800 outline-none focus:border-[#D4AF37] leading-relaxed"
                        />
                      </div>

                      <button
                        onClick={handleGenerateInvitation}
                        disabled={isGeneratingInvitation}
                        className="w-full py-3.5 bg-gradient-to-r from-[#D4AF37] to-[#B89628] hover:brightness-110 disabled:opacity-50 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
                      >
                        {isGeneratingInvitation ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Generando correo de invitación con IA...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-5 h-5" />
                            <span>✨ Generar Correo de Invitación con IA</span>
                          </>
                        )}
                      </button>
                    </>
                  ) : (
                    <div className="space-y-4">
                      {/* Asunto */}
                      <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-[#F3E5AB]">📧 Asunto del Correo</span>
                          <button
                            onClick={() => handleCopy(generatedInvitation.subject, "subject")}
                            className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                          >
                            {copiedKey === "subject" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            Copiar
                          </button>
                        </div>
                        <p className="text-white font-bold text-sm">{generatedInvitation.subject}</p>
                      </div>

                      {/* Para */}
                      <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-slate-400">Para: <span className="text-slate-200 font-bold">{generatedInvitation.to}</span></span>
                        <span className="text-emerald-400 font-bold">📅 {proposedDate}</span>
                      </div>

                      {/* Texto Plano */}
                      <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-300">Texto Plano del Correo:</span>
                          <button
                            onClick={() => handleCopy(generatedInvitation.plain_text, "plaintext")}
                            className="text-[11px] text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            {copiedKey === "plaintext" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            Copiar Texto
                          </button>
                        </div>
                        <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">{generatedInvitation.plain_text}</pre>
                      </div>

                      {/* HTML Body */}
                      <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-300">HTML Completo (para Pegar en Gmail / Resend / SendGrid):</span>
                          <button
                            onClick={() => handleCopy(generatedInvitation.html_body, "html")}
                            className="text-[11px] text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            {copiedKey === "html" ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                            Copiar HTML
                          </button>
                        </div>
                        <textarea
                          readOnly
                          value={generatedInvitation.html_body}
                          rows={6}
                          className="w-full bg-[#0B0D12] text-emerald-300 px-3 py-2 rounded-xl text-[11px] font-mono border border-slate-800 outline-none"
                        />
                      </div>

                      {/* Link de la Reunión */}
                      <div className="flex items-center gap-2">
                        <a
                          href={generatedInvitation.meeting_link}
                          target="_blank"
                          rel="noreferrer"
                          className="flex-1 py-2.5 text-center bg-blue-950/60 border border-blue-700/50 text-blue-300 font-bold rounded-xl text-xs flex items-center justify-center gap-2 hover:bg-blue-900/60 transition"
                        >
                          <Video className="w-4 h-4" />
                          Abrir Link de Demo
                        </a>
                        <button
                          onClick={() => setGeneratedInvitation(null)}
                          className="px-4 py-2.5 bg-slate-900 border border-slate-700 text-slate-300 font-bold rounded-xl text-xs cursor-pointer hover:text-white transition"
                        >
                          Regenerar
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
