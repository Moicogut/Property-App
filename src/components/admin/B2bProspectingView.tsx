import React, { useState, useEffect, useCallback } from "react";
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
  Sparkles,
  RefreshCw,
  ExternalLink,
  Zap,
  Clock,
  Eye,
  X,
  Copy,
  Check,
  Video,
  Filter,
  FileDown,
  BarChart3,
  CheckSquare,
  Square,
  Printer,
  ShieldCheck,
  AlertTriangle,
  Trash2,
  Wand2,
  Star,
} from "lucide-react";

// ─── TYPES ────────────────────────────────────────────────────────────────────

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
  enrichment_status: "PENDING" | "ENRICHED" | "PARTIAL" | "FAILED";
  outreach_status:
    | "NUEVO"
    | "CONTACTADO_WHATSAPP"
    | "EMAIL_ENVIADO"
    | "DEMO_AGENDADA"
    | "RECHAZADO"
    | "CONVERTIDO";
  last_contacted_at?: string;
  meeting_link?: string;
  notes?: string;
  created_at?: string;
  // Google Places fields
  place_id?: string;
  google_rating?: number;
  google_reviews?: number;
  // Data quality fields
  web_status?: "UNVERIFIED" | "ACTIVE" | "BROKEN" | "NONE";
  web_http_status?: number;
  data_quality_score?: number;
  data_source?: "AI_GENERATED" | "GOOGLE_PLACES";
  scrape_attempted_at?: string;
}

// ── Quality badge helper ──────────────────────────────────────────────────────

function QualityBadge({ score, source }: { score?: number; source?: string }) {
  if (source === "AI_GENERATED") {
    return (
      <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-800 text-slate-500 border border-slate-700">
        <AlertTriangle className="w-2.5 h-2.5" /> IA
      </span>
    );
  }
  const s = score ?? 0;
  if (s >= 75) return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-700/40">
      <ShieldCheck className="w-2.5 h-2.5" /> {s}%
    </span>
  );
  if (s >= 40) return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-950/60 text-amber-400 border border-amber-700/40">
      <AlertTriangle className="w-2.5 h-2.5" /> {s}%
    </span>
  );
  return (
    <span className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-950/40 text-rose-400 border border-rose-700/30">
      <AlertTriangle className="w-2.5 h-2.5" /> {s}%
    </span>
  );
}

function WebStatusDot({ status }: { status?: string }) {
  if (status === "ACTIVE") return <span title="Web activa" className="text-emerald-400">●</span>;
  if (status === "BROKEN") return <span title="Web caída" className="text-rose-400">●</span>;
  if (status === "NONE") return <span title="Sin web" className="text-slate-600">●</span>;
  return <span title="Web no verificada" className="text-amber-400">◌</span>;
}

const OUTREACH_STATUS_CONFIG: Record<
  B2bProspect["outreach_status"],
  { label: string; color: string; bg: string }
> = {
  NUEVO: { label: "Nuevo", color: "text-slate-300", bg: "bg-slate-800" },
  CONTACTADO_WHATSAPP: { label: "💬 WhatsApp Enviado", color: "text-emerald-300", bg: "bg-emerald-950/70" },
  EMAIL_ENVIADO: { label: "Email Enviado", color: "text-blue-300", bg: "bg-blue-950/60" },
  DEMO_AGENDADA: { label: "Demo Agendada", color: "text-amber-300", bg: "bg-amber-950/60" },
  RECHAZADO: { label: "Rechazado", color: "text-rose-300", bg: "bg-rose-950/60" },
  CONVERTIDO: { label: "✅ Convertido", color: "text-emerald-300", bg: "bg-emerald-950/60" },
};

const BOLIVIAN_CITIES = [
  "Santa Cruz",
  "La Paz",
  "Cochabamba",
  "Oruro",
  "Potosí",
  "Sucre",
  "Trinidad",
  "Tarija",
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export const B2bProspectingView: React.FC = () => {
  // ── Scan state
  const [scanCity, setScanCity] = useState("Santa Cruz");
  const [prospectCount, setProspectCount] = useState(15);
  const [isScanning, setIsScanning] = useState(false);

  // ── Data state
  const [allProspects, setAllProspects] = useState<B2bProspect[]>([]);
  const [isLoadingProspects, setIsLoadingProspects] = useState(true);

  // ── Filter state
  const [filterCity, setFilterCity] = useState("Todas");
  const [filterSegment, setFilterSegment] = useState<"all" | "phone" | "web" | "email">("all");
  const [searchText, setSearchText] = useState("");

  // ── Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // ── Modal: single prospect
  const [selectedProspect, setSelectedProspect] = useState<B2bProspect | null>(null);
  const [modalMode, setModalMode] = useState<"detail" | "invitation" | "edit">("detail");
  const [editFormData, setEditFormData] = useState<Partial<B2bProspect>>({});
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // ── WhatsApp Pitch Modal state
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [whatsAppProspect, setWhatsAppProspect] = useState<B2bProspect | null>(null);
  const [whatsAppPitchType, setWhatsAppPitchType] = useState<"sofia_ai" | "demo" | "quick_intro">("sofia_ai");
  const [whatsAppCustomText, setWhatsAppCustomText] = useState("");
  const [isGeneratingWAPitch, setIsGeneratingWAPitch] = useState(false);
  const [whatsAppCopied, setWhatsAppCopied] = useState(false);

  // ── Invitation state (single)
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

  // ── Bulk email state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkMeetingType, setBulkMeetingType] = useState<"meet" | "zoom">("meet");
  const [bulkDate, setBulkDate] = useState("el próximo martes a las 10:00 AM");
  const [bulkMessage, setBulkMessage] = useState("");
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null);
  const [bulkResults, setBulkResults] = useState<
    Array<{ prospect: B2bProspect; subject: string; to: string; error?: string }>
  >([]);

  // ── Report state
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTab, setReportTab] = useState<"total" | "selected">("total");

  // ── Convert state
  const [isConverting, setIsConverting] = useState<string | null>(null);

  // ── Enrich state
  const [enrichingIds, setEnrichingIds] = useState<Set<string>>(new Set());
  const [isDeletingAI, setIsDeletingAI] = useState(false);

  // ── Messages
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // ── COMPUTED ─────────────────────────────────────────────────────────────────

  const citiesWithData = [
    "Todas",
    ...Array.from(new Set(allProspects.map((p) => p.city).filter(Boolean))),
  ];

  const visibleProspects = allProspects
    .filter(
      (p) =>
        filterCity === "Todas" ||
        (p.city && p.city.trim().toLowerCase() === filterCity.trim().toLowerCase())
    )
    .filter((p) => {
      if (filterSegment === "phone") return !!(p.phone_official || p.whatsapp_contact);
      if (filterSegment === "web") return !!p.website_url;
      if (filterSegment === "email") return !!p.email_official;
      return true;
    })
    .filter((p) => {
      if (!searchText.trim()) return true;
      const q = searchText.toLowerCase();
      return (
        (p.agency_name || "").toLowerCase().includes(q) ||
        (p.manager_name || "").toLowerCase().includes(q) ||
        (p.email_official || "").toLowerCase().includes(q) ||
        (p.zone || "").toLowerCase().includes(q) ||
        (p.phone_official || "").toLowerCase().includes(q) ||
        (p.whatsapp_contact || "").toLowerCase().includes(q)
      );
    });

  const allVisibleSelected =
    visibleProspects.length > 0 && visibleProspects.every((p) => selectedIds.has(p.id));

  const globalStats = {
    total: allProspects.length,
    nuevo: allProspects.filter((p) => p.outreach_status === "NUEVO").length,
    enviado: allProspects.filter((p) => p.outreach_status === "EMAIL_ENVIADO").length,
    demo: allProspects.filter((p) => p.outreach_status === "DEMO_AGENDADA").length,
    convertido: allProspects.filter((p) => p.outreach_status === "CONVERTIDO").length,
  };

  const qualityStats = {
    fromGoogle: allProspects.filter((p) => p.data_source === "GOOGLE_PLACES").length,
    withWebActive: allProspects.filter((p) => p.web_status === "ACTIVE").length,
    withEmail: allProspects.filter((p) => !!p.email_official).length,
    withPhone: allProspects.filter((p) => !!p.phone_official).length,
    unverifiedWeb: allProspects.filter(
      (p) => p.website_url && p.web_status === "UNVERIFIED"
    ).length,
    avgScore:
      allProspects.length > 0
        ? Math.round(
            allProspects.reduce((s, p) => s + (p.data_quality_score ?? 0), 0) /
              allProspects.length
          )
        : 0,
  };

  // ── LOAD ON MOUNT ─────────────────────────────────────────────────────────

  const loadAllProspects = useCallback(async () => {
    setIsLoadingProspects(true);
    try {
      const res = await fetch("/api/admin/b2b", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list" }),
      });
      if (res.ok) {
        const data = await res.json();
        setAllProspects(data.prospects || []);
      }
    } catch {
      // Empezamos con array vacío si falla
    } finally {
      setIsLoadingProspects(false);
    }
  }, []);

  useEffect(() => {
    loadAllProspects();
  }, [loadAllProspects]);

  // ── SCAN (acumula, no reemplaza) ─────────────────────────────────────────

  const handleScan = async () => {
    setIsScanning(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      const res = await fetch("/api/admin/b2b", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "search",
          city: scanCity,
          country: "Bolivia",
          limit: prospectCount,
        }),
      });
      const data = await res.json();
      const incoming = (data.prospects || []) as B2bProspect[];
      if (incoming.length === 0) {
        setErrorMessage(data.error || `No se encontraron nuevas agencias en ${scanCity}.`);
        return;
      }

      setAllProspects((prev) => {
        const map = new Map<string, B2bProspect>();
        prev.forEach((p) => map.set(p.place_id || p.id || `${p.agency_name}|${p.city}`, p));
        incoming.forEach((p) => map.set(p.place_id || p.id || `${p.agency_name}|${p.city}`, p));
        return Array.from(map.values());
      });
      setFilterCity(scanCity);
      setSuccessMessage(`✅ ${incoming.length} agencias detectadas en ${scanCity}`);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error al escanear agencias");
    } finally {
      setIsScanning(false);
    }
  };

  // ── ENRICH SINGLE PROSPECT (scrape website) ───────────────────────────────

  const handleEnrichOne = async (prospectId: string) => {
    setEnrichingIds((prev) => new Set(prev).add(prospectId));
    try {
      const res = await fetch("/api/admin/b2b", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "enrich", prospectId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enriquecer");
      setAllProspects((prev) =>
        prev.map((p) =>
          p.id === prospectId
            ? {
                ...p,
                email_official: data.email ?? p.email_official,
                whatsapp_contact: data.whatsapp ?? p.whatsapp_contact,
                web_status: data.web_status ?? p.web_status,
                web_http_status: data.http_status ?? p.web_http_status,
                data_quality_score: data.data_quality_score ?? p.data_quality_score,
                scrape_attempted_at: new Date().toISOString(),
              }
            : p
        )
      );
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error enriqueciendo prospecto");
    } finally {
      setEnrichingIds((prev) => {
        const next = new Set(prev);
        next.delete(prospectId);
        return next;
      });
    }
  };

  // ── ENRICH ALL WITH WEBSITE ───────────────────────────────────────────────

  const handleEnrichAllVisible = async () => {
    const targets = visibleProspects.filter(
      (p) => p.website_url && p.web_status === "UNVERIFIED" && !enrichingIds.has(p.id)
    );
    if (targets.length === 0) {
      setSuccessMessage("No hay webs pendientes de verificar en la vista actual.");
      return;
    }
    setSuccessMessage(`⏳ Verificando ${targets.length} sitios web...`);
    for (const p of targets) {
      await handleEnrichOne(p.id);
      await new Promise((r) => setTimeout(r, 300));
    }
    setSuccessMessage(`✅ Verificación completada para ${targets.length} agencias`);
  };

  // ── DELETE AI GENERATED PROSPECTS ─────────────────────────────────────────

  const handleDeleteAI = async () => {
    const aiCount = allProspects.filter((p) => p.data_source === "AI_GENERATED").length;
    if (aiCount === 0) return setErrorMessage("No hay prospectos de IA para limpiar.");
    if (!window.confirm(`¿Eliminar los ${aiCount} prospectos generados por IA? Esta acción no se puede deshacer.`)) return;
    setIsDeletingAI(true);
    try {
      const res = await fetch("/api/admin/b2b", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "delete_ai" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setAllProspects((prev) => prev.filter((p) => p.data_source !== "AI_GENERATED"));
      setSuccessMessage(`🗑 ${data.deleted} prospectos IA eliminados`);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error eliminando prospectos IA");
    } finally {
      setIsDeletingAI(false);
    }
  };

  // ── SINGLE INVITATION ─────────────────────────────────────────────────────

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
      setAllProspects((prev) =>
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

  // ── BULK EMAIL ────────────────────────────────────────────────────────────

  const handleBulkEmail = async () => {
    const targets = visibleProspects.filter((p) => selectedIds.has(p.id));
    if (targets.length === 0) return;

    setBulkResults([]);
    setBulkProgress({ done: 0, total: targets.length });

    const results: Array<{
      prospect: B2bProspect;
      subject: string;
      to: string;
      error?: string;
    }> = [];

    for (let i = 0; i < targets.length; i++) {
      const prospect = targets[i];
      try {
        const res = await fetch("/api/admin/b2b", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "invite",
            prospectId: prospect.id || "local",
            agencyName: prospect.agency_name,
            managerName: prospect.manager_name || "Gerente",
            emailOfficial: prospect.email_official,
            emailPersonal: prospect.email_personal,
            city: prospect.city,
            meetingType: bulkMeetingType,
            proposedDate: bulkDate,
            customMessage: bulkMessage,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error);
        results.push({ prospect, subject: data.subject, to: data.to });
        setAllProspects((prev) =>
          prev.map((p) =>
            p.id === prospect.id ? { ...p, outreach_status: "EMAIL_ENVIADO" } : p
          )
        );
      } catch (err) {
        results.push({
          prospect,
          subject: "ERROR",
          to: prospect.email_official || "—",
          error: err instanceof Error ? err.message : "Error desconocido",
        });
      }
      setBulkProgress({ done: i + 1, total: targets.length });
      if (i < targets.length - 1) await new Promise((r) => setTimeout(r, 400));
    }

    setBulkResults(results);
    setBulkProgress(null);
    setSuccessMessage(
      `✅ ${results.filter((r) => !r.error).length}/${targets.length} correos generados`
    );
  };

  // ── CONVERT ───────────────────────────────────────────────────────────────

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
      setAllProspects((prev) =>
        prev.map((p) => (p.id === prospect.id ? { ...p, outreach_status: "CONVERTIDO" } : p))
      );
      setSuccessMessage(
        `✅ ${prospect.agency_name} convertida a inmobiliaria activa — Org ID: ${data.organization?.id}`
      );
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error convirtiendo prospecto");
    } finally {
      setIsConverting(null);
    }
  };

  // ── SELECTION ─────────────────────────────────────────────────────────────

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (allVisibleSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(visibleProspects.map((p) => p.id)));
    }
  };

  // ── CSV EXPORT ────────────────────────────────────────────────────────────

  const exportCSV = (data: B2bProspect[], filename: string) => {
    const headers = [
      "Agencia",
      "Ciudad",
      "Zona",
      "Gerente",
      "Cargo",
      "Email Oficial",
      "Email Personal",
      "Teléfono",
      "WhatsApp",
      "Sitio Web",
      "Estado Pipeline",
      "Último Contacto",
    ];
    const rows = data.map((p) => [
      p.agency_name,
      p.city,
      p.zone || "",
      p.manager_name || "",
      p.manager_role || "",
      p.email_official || "",
      p.email_personal || "",
      p.phone_official || "",
      p.whatsapp_contact || "",
      p.website_url || "",
      p.outreach_status,
      p.last_contacted_at || "",
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── HELPERS ───────────────────────────────────────────────────────────────

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  const openDetailModal = (
    prospect: B2bProspect,
    mode: "detail" | "invitation" | "edit" = "detail"
  ) => {
    setSelectedProspect(prospect);
    setEditFormData({
      manager_name: prospect.manager_name || "",
      manager_role: prospect.manager_role || "Gerente Comercial",
      email_official: prospect.email_official || "",
      whatsapp_contact: prospect.whatsapp_contact || "",
      phone_official: prospect.phone_official || "",
      website_url: prospect.website_url || "",
      outreach_status: prospect.outreach_status || "NUEVO",
      notes: prospect.notes || "",
    });
    setModalMode(mode);
    setGeneratedInvitation(null);
    setErrorMessage(null);
  };

  const closeModal = () => {
    setSelectedProspect(null);
    setGeneratedInvitation(null);
  };

  // ── QUICK EDIT HANDLER ───────────────────────────────────────────────────

  const handleSaveEdit = async () => {
    if (!selectedProspect) return;
    setIsSavingEdit(true);
    try {
      const res = await fetch("/api/admin/b2b", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          prospectId: selectedProspect.id,
          updates: editFormData,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar");
      const updated = data.prospect as B2bProspect;
      setAllProspects((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      setSelectedProspect(updated);
      setSuccessMessage(`✅ Datos de ${updated.agency_name} actualizados`);
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Error al guardar cambios");
    } finally {
      setIsSavingEdit(false);
    }
  };

  // ── WHATSAPP PITCH HANDLERS ──────────────────────────────────────────────

  const handleOpenWhatsAppModal = async (prospect: B2bProspect) => {
    setWhatsAppProspect(prospect);
    setShowWhatsAppModal(true);
    setWhatsAppCopied(false);
    setIsGeneratingWAPitch(true);
    setWhatsAppCustomText("");
    try {
      const res = await fetch("/api/admin/b2b", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "whatsapp_pitch",
          prospectId: prospect.id,
          agencyName: prospect.agency_name,
          managerName: prospect.manager_name || "",
          phone: prospect.whatsapp_contact || prospect.phone_official || "",
          city: prospect.city,
          pitchType: whatsAppPitchType,
        }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setWhatsAppCustomText(data.message);
      }
    } catch {
      // Fallback
    } finally {
      setIsGeneratingWAPitch(false);
    }
  };

  const handleRegenerateWAPitch = async (pitchType: "sofia_ai" | "demo" | "quick_intro") => {
    if (!whatsAppProspect) return;
    setWhatsAppPitchType(pitchType);
    setIsGeneratingWAPitch(true);
    try {
      const res = await fetch("/api/admin/b2b", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "whatsapp_pitch",
          prospectId: whatsAppProspect.id,
          agencyName: whatsAppProspect.agency_name,
          managerName: whatsAppProspect.manager_name || "",
          phone: whatsAppProspect.whatsapp_contact || whatsAppProspect.phone_official || "",
          city: whatsAppProspect.city,
          pitchType,
        }),
      });
      const data = await res.json();
      if (res.ok && data.message) {
        setWhatsAppCustomText(data.message);
      }
    } catch {
      // Fallback
    } finally {
      setIsGeneratingWAPitch(false);
    }
  };

  const handleSendWhatsApp = () => {
    if (!whatsAppProspect) return;
    const rawPhone = whatsAppProspect.whatsapp_contact || whatsAppProspect.phone_official || "";
    const cleanPhone = rawPhone.replace(/[^0-9]/g, "");
    let formattedPhone = cleanPhone;
    if (formattedPhone.length === 8 && (formattedPhone.startsWith("6") || formattedPhone.startsWith("7"))) {
      formattedPhone = `591${formattedPhone}`;
    }
    const url = formattedPhone
      ? `https://wa.me/${formattedPhone}?text=${encodeURIComponent(whatsAppCustomText)}`
      : `https://wa.me/?text=${encodeURIComponent(whatsAppCustomText)}`;

    window.open(url, "_blank");

    // Actualizar estado en Supabase y local
    fetch("/api/admin/b2b", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update",
        prospectId: whatsAppProspect.id,
        updates: { outreach_status: "CONTACTADO_WHATSAPP", last_contacted_at: new Date().toISOString() },
      }),
    }).then(() => {
      setAllProspects((prev) =>
        prev.map((p) =>
          p.id === whatsAppProspect.id
            ? { ...p, outreach_status: "CONTACTADO_WHATSAPP", last_contacted_at: new Date().toISOString() }
            : p
        )
      );
    });

    setShowWhatsAppModal(false);
  };

  // ── RENDER ────────────────────────────────────────────────────────────────

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
              Descubre gerentes y brokers de agencias inmobiliarias por ciudad. Genera y
              envía invitaciones de demo en 1 clic.
            </p>
          </div>
          {allProspects.length > 0 && (
            <div className="flex flex-col gap-3">
              {/* Pipeline stats */}
              <div className="flex flex-wrap gap-2 text-xs">
                {[
                  { label: "Total", value: globalStats.total, color: "text-slate-300" },
                  { label: "Nuevos", value: globalStats.nuevo, color: "text-slate-400" },
                  { label: "Enviados", value: globalStats.enviado, color: "text-blue-400" },
                  { label: "Demos", value: globalStats.demo, color: "text-amber-400" },
                  { label: "Convertidos", value: globalStats.convertido, color: "text-emerald-400" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-center min-w-[60px]">
                    <div className={`font-black text-lg ${stat.color}`}>{stat.value}</div>
                    <div className="text-slate-500 text-[10px]">{stat.label}</div>
                  </div>
                ))}
              </div>
              {/* Quality stats */}
              <div className="flex flex-wrap gap-2 text-[11px]">
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/40 border border-emerald-700/30 rounded-lg text-emerald-400">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Google Places: <strong>{qualityStats.fromGoogle}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-slate-300">
                  <Globe className="w-3 h-3 text-emerald-400" />
                  <span>Web real: <strong>{qualityStats.withWebActive}</strong>/{allProspects.filter(p => p.website_url).length}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-slate-300">
                  <Mail className="w-3 h-3 text-[#D4AF37]" />
                  <span>Con email: <strong>{qualityStats.withEmail}</strong></span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-slate-300">
                  <Phone className="w-3 h-3 text-[#D4AF37]" />
                  <span>Con teléfono: <strong>{qualityStats.withPhone}</strong></span>
                </div>
                {qualityStats.unverifiedWeb > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-950/40 border border-amber-700/30 rounded-lg text-amber-400">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Sin verificar: <strong>{qualityStats.unverifiedWeb}</strong> webs</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 border border-slate-700 rounded-lg text-slate-300">
                  <Star className="w-3 h-3 text-[#D4AF37]" />
                  <span>Calidad prom: <strong>{qualityStats.avgScore}%</strong></span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── MENSAJES ── */}
      {successMessage && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs flex items-center justify-between">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage(null)}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
      {errorMessage && (
        <div className="p-3 bg-rose-950/80 border border-rose-500/50 rounded-xl text-rose-300 text-xs flex items-center justify-between">
          <span>⚠️ {errorMessage}</span>
          <button onClick={() => setErrorMessage(null)}>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ── PANEL DE BÚSQUEDA (SCAN) ── */}
      <div className="bg-[#111622] border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1 space-y-1.5">
            <label className="text-xs font-bold text-[#F3E5AB]">Ciudad de Búsqueda:</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
              {BOLIVIAN_CITIES.slice(0, 4).map((c) => (
                <button
                  key={c}
                  onClick={() => setScanCity(c)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer ${
                    scanCity === c
                      ? "bg-[#D4AF37] text-slate-950 border-[#D4AF37] font-black"
                      : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                  }`}
                >
                  📍 {c}
                </button>
              ))}
            </div>
            <select
              value={scanCity}
              onChange={(e) => setScanCity(e.target.value)}
              className="w-full bg-slate-950 text-slate-200 px-3 py-2.5 rounded-xl text-xs border border-slate-800 outline-none focus:border-[#D4AF37]"
            >
              {BOLIVIAN_CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
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
                <span>Escaneando {scanCity}...</span>
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

      {/* ── BARRA DE FILTROS Y ACCIONES ── */}
      {(allProspects.length > 0 || isLoadingProspects) && (
        <div className="bg-[#111622] border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
          {/* Badges por ciudad */}
          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
            {citiesWithData.map((c) => {
              const count =
                c === "Todas"
                  ? allProspects.length
                  : allProspects.filter((p) => p.city === c).length;
              return (
                <button
                  key={c}
                  onClick={() => setFilterCity(c)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-bold border transition cursor-pointer flex items-center gap-1.5 ${
                    filterCity === c
                      ? "bg-[#D4AF37] text-slate-950 border-[#D4AF37]"
                      : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white hover:border-slate-600"
                  }`}
                >
                  {c !== "Todas" && "📍"} {c}
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                      filterCity === c
                        ? "bg-slate-950/30 text-slate-900"
                        : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Filtros por Segmento (Canal Bolivia) */}
          <div className="flex flex-wrap gap-2 items-center pt-1 border-t border-slate-800/60">
            <span className="text-[11px] text-slate-500 font-bold">Segmento:</span>
            {[
              { id: "all", label: "Todas", count: allProspects.length },
              {
                id: "phone",
                label: "📱 Con Tel / WhatsApp",
                count: allProspects.filter((p) => p.phone_official || p.whatsapp_contact).length,
              },
              {
                id: "web",
                label: "🌐 Con Web",
                count: allProspects.filter((p) => p.website_url).length,
              },
              {
                id: "email",
                label: "✉️ Con Email",
                count: allProspects.filter((p) => p.email_official).length,
              },
            ].map((seg) => (
              <button
                key={seg.id}
                onClick={() => setFilterSegment(seg.id as any)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer border ${
                  filterSegment === seg.id
                    ? "bg-[#D4AF37] text-slate-950 border-[#D4AF37]"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                }`}
              >
                {seg.label} ({seg.count})
              </button>
            ))}
          </div>

          {/* Buscador + acciones masivas */}
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="Buscar agencia, gerente, email, zona..."
                className="w-full pl-9 pr-8 py-2 bg-slate-950 text-slate-200 rounded-xl text-xs border border-slate-800 outline-none focus:border-[#D4AF37] placeholder-slate-600"
              />
              {searchText && (
                <button
                  onClick={() => setSearchText("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex gap-2 flex-wrap">
              {/* Select all */}
              <button
                onClick={toggleSelectAll}
                className="px-3 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
              >
                {allVisibleSelected ? (
                  <CheckSquare className="w-3.5 h-3.5 text-[#D4AF37]" />
                ) : (
                  <Square className="w-3.5 h-3.5" />
                )}
                {allVisibleSelected ? "Quitar Todo" : "Sel. Todo"}
              </button>

              {/* Verificar webs */}
              {qualityStats.unverifiedWeb > 0 && (
                <button
                  onClick={handleEnrichAllVisible}
                  disabled={enrichingIds.size > 0}
                  title={`Verificar ${qualityStats.unverifiedWeb} webs pendientes y extraer emails`}
                  className="px-3 py-2 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-700/40 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition disabled:opacity-50"
                >
                  {enrichingIds.size > 0 ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Wand2 className="w-3.5 h-3.5" />
                  )}
                  Verificar Webs ({qualityStats.unverifiedWeb})
                </button>
              )}

              {/* Limpiar IA */}
              {allProspects.some(p => p.data_source === "AI_GENERATED") && (
                <button
                  onClick={handleDeleteAI}
                  disabled={isDeletingAI}
                  title="Eliminar prospectos generados por IA (datos ficticios)"
                  className="px-3 py-2 bg-rose-950/50 hover:bg-rose-900/50 border border-rose-700/40 text-rose-400 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition disabled:opacity-50"
                >
                  {isDeletingAI ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                  Limpiar IA
                </button>
              )}

              {/* Bulk email */}
              <button
                onClick={() => {
                  setBulkResults([]);
                  setBulkProgress(null);
                  setShowBulkModal(true);
                }}
                disabled={selectedIds.size === 0}
                className="px-3 py-2 bg-[#D4AF37]/20 hover:bg-[#D4AF37]/30 border border-[#D4AF37]/40 text-[#F3E5AB] rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Correo Masivo ({selectedIds.size})
              </button>

              {/* Report */}
              <button
                onClick={() => {
                  setReportTab("total");
                  setShowReportModal(true);
                }}
                className="px-3 py-2 bg-blue-950/60 hover:bg-blue-900/60 border border-blue-700/40 text-blue-300 rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                Reporte
              </button>

              {/* Refresh */}
              <button
                onClick={loadAllProspects}
                disabled={isLoadingProspects}
                className="px-3 py-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingProspects ? "animate-spin" : ""}`} />
              </button>
            </div>
          </div>

          {/* Info selección */}
          {selectedIds.size > 0 && (
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#D4AF37]" />
              {selectedIds.size} agencias seleccionadas
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-rose-400 hover:text-rose-300 cursor-pointer ml-1"
              >
                (limpiar selección)
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── TABLA DE PROSPECTOS ── */}
      {visibleProspects.length > 0 && (
        <div className="bg-[#111622] border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-black text-white">
              {filterCity === "Todas" ? "Todas las Agencias" : `Agencias en ${filterCity}`}
              <span className="text-slate-500 font-normal ml-2">
                ({visibleProspects.length}
                {searchText && ` de ${allProspects.filter((p) => filterCity === "Todas" || p.city === filterCity).length}`})
              </span>
            </h3>
            {searchText && (
              <span className="text-[11px] text-[#D4AF37]">
                Filtrado por: "{searchText}"
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-950/60 text-slate-400 text-[11px] uppercase">
                  <th className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={toggleSelectAll}
                      className="accent-[#D4AF37] cursor-pointer w-3.5 h-3.5"
                    />
                  </th>
                  <th className="text-left px-3 py-3 font-bold">Agencia / Zona</th>
                  <th className="text-left px-3 py-3 font-bold">Ciudad</th>
                  <th className="text-left px-4 py-3 font-bold">Gerente / Cargo</th>
                  <th className="text-left px-4 py-3 font-bold">Contacto</th>
                  <th className="text-left px-4 py-3 font-bold">Estado Pipeline</th>
                  <th className="text-left px-4 py-3 font-bold">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {visibleProspects.map((prospect, idx) => {
                  const statusCfg = OUTREACH_STATUS_CONFIG[prospect.outreach_status];
                  const isSelected = selectedIds.has(prospect.id);
                  return (
                    <tr
                      key={prospect.id || idx}
                      className={`hover:bg-slate-900/40 transition group ${
                        isSelected
                          ? "bg-[#D4AF37]/5 border-l-2 border-l-[#D4AF37]/60"
                          : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-4">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSelect(prospect.id)}
                          className="accent-[#D4AF37] cursor-pointer w-3.5 h-3.5"
                        />
                      </td>

                      {/* Agencia / Zona */}
                      <td className="px-3 py-4">
                        <div className="font-black text-white text-[13px]">
                          {prospect.agency_name}
                        </div>
                        <div className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          {prospect.zone || "—"}
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

                      {/* Ciudad */}
                      <td className="px-3 py-4">
                        <button
                          onClick={() => setFilterCity(prospect.city)}
                          className="px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded-lg text-[11px] text-slate-300 font-medium transition cursor-pointer"
                        >
                          📍 {prospect.city}
                        </button>
                      </td>

                      {/* Gerente / Cargo */}
                      <td className="px-4 py-4">
                        <div className="font-bold text-slate-200">
                          {prospect.manager_name || "—"}
                        </div>
                        <div className="text-slate-400 text-[11px]">
                          {prospect.manager_role || "—"}
                        </div>
                      </td>

                      {/* Contacto */}
                      <td className="px-4 py-4 space-y-1">
                        {prospect.email_official && (
                          <div className="flex items-center gap-1 text-slate-300">
                            <Mail className="w-3 h-3 text-[#D4AF37]" />
                            <span className="truncate max-w-[160px]">
                              {prospect.email_official}
                            </span>
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

                      {/* Estado Pipeline + Calidad */}
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
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <QualityBadge score={prospect.data_quality_score} source={prospect.data_source} />
                          {prospect.website_url && <WebStatusDot status={prospect.web_status} />}
                        </div>
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => openDetailModal(prospect, "detail")}
                            title="Ver / Editar Detalles"
                            className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-800 transition cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {/* WhatsApp 1-Clic Pitch */}
                          {(prospect.phone_official || prospect.whatsapp_contact) && (
                            <button
                              onClick={() => handleOpenWhatsAppModal(prospect)}
                              title="💬 Pitch de WhatsApp 1-Clic con IA"
                              className="p-1.5 bg-emerald-950/70 hover:bg-emerald-900/80 text-emerald-400 rounded-lg border border-emerald-600/50 transition cursor-pointer"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {/* Enrich individual: solo si tiene web y no se ha scrapeado */}
                          {prospect.website_url && prospect.web_status === "UNVERIFIED" && (
                            <button
                              onClick={() => handleEnrichOne(prospect.id)}
                              disabled={enrichingIds.has(prospect.id)}
                              title="Verificar web y extraer email real"
                              className="p-1.5 bg-emerald-950/50 hover:bg-emerald-900/50 text-emerald-400 rounded-lg border border-emerald-700/30 transition cursor-pointer disabled:opacity-40"
                            >
                              {enrichingIds.has(prospect.id) ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Wand2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
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
                            disabled={
                              prospect.outreach_status === "CONVERTIDO" ||
                              isConverting === prospect.id
                            }
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
      {!isScanning && !isLoadingProspects && allProspects.length === 0 && (
        <div className="bg-[#111622] border border-slate-800 rounded-2xl p-16 text-center">
          <Building2 className="w-14 h-14 text-slate-700 mx-auto mb-4" />
          <h3 className="text-white font-black text-lg mb-2">Sin Prospectos Aún</h3>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Selecciona una ciudad boliviana y presiona{" "}
            <strong>"🔍 Escanear Agencias"</strong> para detectar gerentes y brokers de
            agencias inmobiliarias.
          </p>
        </div>
      )}

      {/* ── CARGANDO ── */}
      {isLoadingProspects && allProspects.length === 0 && (
        <div className="bg-[#111622] border border-slate-800 rounded-2xl p-16 text-center">
          <Loader2 className="w-8 h-8 text-[#D4AF37] mx-auto mb-4 animate-spin" />
          <p className="text-slate-400 text-sm">Cargando prospectos...</p>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          MODAL: DETALLE / GENERADOR DE INVITACIÓN INDIVIDUAL
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
                  <h3 className="font-black text-white text-base">
                    {selectedProspect.agency_name}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedProspect.city} — {selectedProspect.manager_name}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setModalMode("detail")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
                    modalMode === "detail"
                      ? "bg-[#D4AF37] text-slate-950"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  Detalles
                </button>
                <button
                  onClick={() => setModalMode("edit")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
                    modalMode === "edit"
                      ? "bg-[#D4AF37] text-slate-950"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => setModalMode("invitation")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition ${
                    modalMode === "invitation"
                      ? "bg-[#D4AF37] text-slate-950"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Sparkles className="w-3 h-3 inline mr-1" />
                  Invitación
                </button>
                {(selectedProspect.phone_official || selectedProspect.whatsapp_contact) && (
                  <button
                    onClick={() => {
                      closeModal();
                      handleOpenWhatsAppModal(selectedProspect);
                    }}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-950/80 text-emerald-400 border border-emerald-700/50 hover:bg-emerald-900 cursor-pointer transition flex items-center gap-1"
                  >
                    <MessageSquare className="w-3 h-3" />
                    WhatsApp
                  </button>
                )}
                <button
                  onClick={closeModal}
                  className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* ── MODO DETALLE ── */}
              {modalMode === "detail" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    {[
                      {
                        label: "Agencia",
                        value: selectedProspect.agency_name,
                        icon: <Building2 className="w-3.5 h-3.5 text-[#D4AF37]" />,
                      },
                      {
                        label: "Ciudad / Zona",
                        value: `${selectedProspect.city} — ${selectedProspect.zone || "N/A"}`,
                        icon: <MapPin className="w-3.5 h-3.5 text-[#D4AF37]" />,
                      },
                      {
                        label: "Gerente",
                        value: selectedProspect.manager_name || "— (clic en Editar para agregar)",
                        icon: <User className="w-3.5 h-3.5 text-[#D4AF37]" />,
                      },
                      {
                        label: "Cargo",
                        value: selectedProspect.manager_role || "—",
                        icon: <User className="w-3.5 h-3.5 text-slate-400" />,
                      },
                      {
                        label: "Email Oficial",
                        value: selectedProspect.email_official || "—",
                        icon: <Mail className="w-3.5 h-3.5 text-[#D4AF37]" />,
                      },
                      {
                        label: "Email Personal",
                        value: selectedProspect.email_personal || "—",
                        icon: <Mail className="w-3.5 h-3.5 text-slate-400" />,
                      },
                      {
                        label: "Teléfono Oficial",
                        value: selectedProspect.phone_official || "—",
                        icon: <Phone className="w-3.5 h-3.5 text-[#D4AF37]" />,
                      },
                      {
                        label: "WhatsApp",
                        value: selectedProspect.whatsapp_contact || selectedProspect.phone_official || "—",
                        icon: <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />,
                      },
                      {
                        label: "Sitio Web",
                        value: selectedProspect.website_url || "—",
                        icon: <Globe className="w-3.5 h-3.5 text-[#D4AF37]" />,
                      },
                      {
                        label: "Calidad de Datos",
                        value: `${selectedProspect.data_quality_score ?? 0}% (${selectedProspect.data_source || "AI"})`,
                        icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />,
                      },
                    ].map((field) => (
                      <div
                        key={field.label}
                        className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800"
                      >
                        <div className="flex items-center gap-1.5 text-slate-400 mb-1">
                          {field.icon}
                          <span>{field.label}</span>
                        </div>
                        <div className="text-slate-200 font-medium text-[13px] break-all">
                          {field.value}
                        </div>
                      </div>
                    ))}
                    {selectedProspect.notes && (
                      <div className="sm:col-span-2 bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                        <div className="text-slate-400 mb-1">Notas</div>
                        <div className="text-slate-300 text-[13px] leading-relaxed">
                          {selectedProspect.notes}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setModalMode("edit")}
                      className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
                    >
                      ✏️ Editar Datos de Contacto
                    </button>
                    {(selectedProspect.phone_official || selectedProspect.whatsapp_contact) && (
                      <button
                        onClick={() => {
                          closeModal();
                          handleOpenWhatsAppModal(selectedProspect);
                        }}
                        className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:brightness-110 text-white rounded-xl text-xs font-black shadow transition cursor-pointer flex items-center gap-1.5"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        Abrir Pitch de WhatsApp
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* ── MODO EDITAR ── */}
              {modalMode === "edit" && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-1">
                      <label className="font-bold text-slate-300">Nombre de Agencia</label>
                      <input
                        type="text"
                        value={editFormData.agency_name || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, agency_name: e.target.value })}
                        className="w-full bg-slate-950 text-slate-200 px-3 py-2 rounded-xl border border-slate-800 outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-[#F3E5AB]">Gerente / Contacto Clave</label>
                      <input
                        type="text"
                        placeholder="Ej. Lic. Carlos Mendoza"
                        value={editFormData.manager_name || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, manager_name: e.target.value })}
                        className="w-full bg-slate-950 text-slate-200 px-3 py-2 rounded-xl border border-slate-800 outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-300">Cargo</label>
                      <input
                        type="text"
                        placeholder="Ej. Gerente Comercial"
                        value={editFormData.manager_role || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, manager_role: e.target.value })}
                        className="w-full bg-slate-950 text-slate-200 px-3 py-2 rounded-xl border border-slate-800 outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-300">Email Oficial</label>
                      <input
                        type="email"
                        placeholder="contacto@agencia.com"
                        value={editFormData.email_official || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, email_official: e.target.value })}
                        className="w-full bg-slate-950 text-slate-200 px-3 py-2 rounded-xl border border-slate-800 outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-300">Teléfono</label>
                      <input
                        type="text"
                        placeholder="+591 7XXXXXXX"
                        value={editFormData.phone_official || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, phone_official: e.target.value })}
                        className="w-full bg-slate-950 text-slate-200 px-3 py-2 rounded-xl border border-slate-800 outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-emerald-400">WhatsApp Directo</label>
                      <input
                        type="text"
                        placeholder="+591 7XXXXXXX"
                        value={editFormData.whatsapp_contact || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, whatsapp_contact: e.target.value })}
                        className="w-full bg-slate-950 text-slate-200 px-3 py-2 rounded-xl border border-slate-800 outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-300">Sitio Web</label>
                      <input
                        type="url"
                        placeholder="https://..."
                        value={editFormData.website_url || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, website_url: e.target.value })}
                        className="w-full bg-slate-950 text-slate-200 px-3 py-2 rounded-xl border border-slate-800 outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="font-bold text-slate-300">Estado Pipeline</label>
                      <select
                        value={editFormData.outreach_status || "NUEVO"}
                        onChange={(e) => setEditFormData({ ...editFormData, outreach_status: e.target.value as any })}
                        className="w-full bg-slate-950 text-slate-200 px-3 py-2 rounded-xl border border-slate-800 outline-none"
                      >
                        {Object.entries(OUTREACH_STATUS_CONFIG).map(([k, v]) => (
                          <option key={k} value={k}>{v.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="sm:col-span-2 space-y-1">
                      <label className="font-bold text-slate-300">Notas de Contacto</label>
                      <textarea
                        rows={3}
                        placeholder="Comentarios de llamadas, interés expresado, etc..."
                        value={editFormData.notes || ""}
                        onChange={(e) => setEditFormData({ ...editFormData, notes: e.target.value })}
                        className="w-full bg-slate-950 text-slate-200 px-3 py-2 rounded-xl border border-slate-800 outline-none focus:border-[#D4AF37]"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      onClick={() => setModalMode("detail")}
                      className="px-4 py-2 text-slate-400 hover:text-white rounded-xl text-xs cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={isSavingEdit}
                      className="px-6 py-2.5 bg-[#D4AF37] hover:brightness-110 text-slate-950 rounded-xl text-xs font-black shadow transition cursor-pointer flex items-center gap-1.5"
                    >
                      {isSavingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                      💾 Guardar Cambios
                    </button>
                  </div>
                </div>
              )}

              {/* ── MODO INVITACIÓN ── */}
              {modalMode === "invitation" && (
                <div className="space-y-5">
                  {!generatedInvitation ? (
                    <>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-[#F3E5AB]">
                            Plataforma de Demo:
                          </label>
                          <div className="flex gap-2">
                            {(["meet", "zoom"] as const).map((t) => (
                              <button
                                key={t}
                                onClick={() => setMeetingType(t)}
                                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                                  meetingType === t
                                    ? "bg-[#D4AF37] text-slate-950 border-[#D4AF37]"
                                    : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                                }`}
                              >
                                <Video className="w-3.5 h-3.5" />
                                {t === "meet" ? "Google Meet" : "Zoom"}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold text-slate-300">
                            Fecha / Hora Propuesta:
                          </label>
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
                        <label className="text-xs font-bold text-slate-300">
                          Mensaje Adicional (Opcional):
                        </label>
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
                          <span className="text-xs font-bold text-[#F3E5AB]">
                            📧 Asunto del Correo
                          </span>
                          <button
                            onClick={() =>
                              handleCopy(generatedInvitation.subject, "subject")
                            }
                            className="text-[11px] text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                          >
                            {copiedKey === "subject" ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            Copiar
                          </button>
                        </div>
                        <p className="text-white font-bold text-sm">
                          {generatedInvitation.subject}
                        </p>
                      </div>

                      {/* Para */}
                      <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-slate-400">
                          Para:{" "}
                          <span className="text-slate-200 font-bold">
                            {generatedInvitation.to}
                          </span>
                        </span>
                        <span className="text-emerald-400 font-bold">📅 {proposedDate}</span>
                      </div>

                      {/* Texto Plano */}
                      <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-300">
                            Texto Plano del Correo:
                          </span>
                          <button
                            onClick={() =>
                              handleCopy(generatedInvitation.plain_text, "plaintext")
                            }
                            className="text-[11px] text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            {copiedKey === "plaintext" ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            Copiar Texto
                          </button>
                        </div>
                        <pre className="text-xs text-slate-300 whitespace-pre-wrap font-sans leading-relaxed">
                          {generatedInvitation.plain_text}
                        </pre>
                      </div>

                      {/* HTML Body */}
                      <div className="bg-slate-950/80 p-4 rounded-xl border border-slate-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-bold text-slate-300">
                            HTML Completo (para Gmail / Resend / SendGrid):
                          </span>
                          <button
                            onClick={() =>
                              handleCopy(generatedInvitation.html_body, "html")
                            }
                            className="text-[11px] text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
                          >
                            {copiedKey === "html" ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
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

                      {/* Link reunión */}
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

      {/* ════════════════════════════════════════════════════════════════
          MODAL: CORREO MASIVO
      ════════════════════════════════════════════════════════════════ */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#111622] border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800 sticky top-0 bg-[#111622] z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#D4AF37]/20 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">Correo Masivo con IA</h3>
                  <p className="text-xs text-slate-400">
                    {selectedIds.size} agencias seleccionadas
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowBulkModal(false)}
                className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* ── Config (solo cuando no hay progreso ni resultados) ── */}
              {!bulkProgress && bulkResults.length === 0 && (
                <>
                  {/* Chips de agencias seleccionadas */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#F3E5AB]">
                      Agencias a contactar:
                    </label>
                    <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-slate-950/60 rounded-xl border border-slate-800">
                      {visibleProspects
                        .filter((p) => selectedIds.has(p.id))
                        .map((p) => (
                          <span
                            key={p.id}
                            className="px-2 py-1 bg-slate-800 text-slate-300 rounded-lg text-[11px] flex items-center gap-1"
                          >
                            📍 {p.agency_name}{" "}
                            <span className="text-slate-500">({p.city})</span>
                          </span>
                        ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">Plataforma:</label>
                      <div className="flex gap-2">
                        {(["meet", "zoom"] as const).map((t) => (
                          <button
                            key={t}
                            onClick={() => setBulkMeetingType(t)}
                            className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center justify-center gap-1.5 ${
                              bulkMeetingType === t
                                ? "bg-[#D4AF37] text-slate-950 border-[#D4AF37]"
                                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                            }`}
                          >
                            <Video className="w-3.5 h-3.5" />
                            {t === "meet" ? "Google Meet" : "Zoom"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-300">
                        Fecha / Hora:
                      </label>
                      <input
                        type="text"
                        value={bulkDate}
                        onChange={(e) => setBulkDate(e.target.value)}
                        className="w-full bg-slate-950 text-slate-200 px-3 py-2.5 rounded-xl text-xs border border-slate-800 outline-none focus:border-[#D4AF37]"
                        placeholder="ej. martes 26 de agosto a las 10:00 AM"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">
                      Mensaje adicional (opcional):
                    </label>
                    <textarea
                      value={bulkMessage}
                      onChange={(e) => setBulkMessage(e.target.value)}
                      rows={2}
                      className="w-full bg-slate-950 text-slate-200 px-3 py-2.5 rounded-xl text-xs border border-slate-800 outline-none focus:border-[#D4AF37] leading-relaxed"
                      placeholder="Contexto adicional para personalizar cada correo..."
                    />
                  </div>

                  <button
                    onClick={handleBulkEmail}
                    className="w-full py-3.5 bg-gradient-to-r from-[#D4AF37] to-[#B89628] hover:brightness-110 text-slate-950 font-black rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg cursor-pointer transition"
                  >
                    <Sparkles className="w-5 h-5" />✨ Generar {selectedIds.size} Correos
                    con IA
                  </button>
                </>
              )}

              {/* ── Progress bar ── */}
              {bulkProgress && (
                <div className="space-y-5 py-4">
                  <div className="text-center">
                    <Loader2 className="w-10 h-10 text-[#D4AF37] mx-auto mb-3 animate-spin" />
                    <p className="text-white font-black text-base">
                      Procesando {bulkProgress.done}/{bulkProgress.total}...
                    </p>
                    <p className="text-slate-400 text-xs mt-1">
                      Generando correos personalizados con IA
                    </p>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-[#D4AF37] to-[#B89628] h-3 rounded-full transition-all duration-500"
                      style={{
                        width: `${(bulkProgress.done / bulkProgress.total) * 100}%`,
                      }}
                    />
                  </div>
                  <p className="text-center text-[#D4AF37] font-black text-2xl">
                    {Math.round((bulkProgress.done / bulkProgress.total) * 100)}%
                  </p>
                </div>
              )}

              {/* ── Resultados ── */}
              {bulkResults.length > 0 && !bulkProgress && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-black text-white">
                      ✅ {bulkResults.filter((r) => !r.error).length}/{bulkResults.length}{" "}
                      correos generados
                    </h4>
                    <button
                      onClick={() => {
                        const csv = ["Agencia,Ciudad,Email,Asunto"]
                          .concat(
                            bulkResults.map(
                              (r) =>
                                `"${r.prospect.agency_name}","${r.prospect.city}","${r.to}","${r.subject}"`
                            )
                          )
                          .join("\n");
                        navigator.clipboard.writeText(csv);
                        handleCopy(csv, "bulk-csv");
                      }}
                      className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      {copiedKey === "bulk-csv" ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      Copiar CSV
                    </button>
                  </div>

                  <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                    {bulkResults.map((r, i) => (
                      <div
                        key={i}
                        className={`flex items-start gap-3 p-3 text-xs ${
                          r.error ? "bg-rose-950/20" : "bg-slate-950/40"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-white truncate">
                            {r.prospect.agency_name}
                            <span className="text-slate-500 font-normal ml-1">
                              ({r.prospect.city})
                            </span>
                          </div>
                          <div className="text-slate-400 text-[11px]">{r.to}</div>
                          {r.error ? (
                            <div className="text-rose-400 text-[11px]">❌ {r.error}</div>
                          ) : (
                            <div className="text-slate-300 text-[11px] truncate">
                              {r.subject}
                            </div>
                          )}
                        </div>
                        {!r.error && (
                          <button
                            onClick={() => handleCopy(r.subject, `bulk-${i}`)}
                            className="text-slate-400 hover:text-white cursor-pointer flex-shrink-0 mt-0.5"
                          >
                            {copiedKey === `bulk-${i}` ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      setBulkResults([]);
                      setBulkProgress(null);
                    }}
                    className="w-full py-2.5 bg-slate-900 border border-slate-700 text-slate-300 font-bold rounded-xl text-xs cursor-pointer hover:text-white transition"
                  >
                    ↩ Nueva Campaña
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          MODAL: REPORTE
      ════════════════════════════════════════════════════════════════ */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#111622] border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800 sticky top-0 bg-[#111622] z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-900/40 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base">Reporte B2B</h3>
                  <p className="text-xs text-slate-400">
                    Análisis de prospectos y pipeline de ventas
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  title="Imprimir"
                  className="p-2 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-lg cursor-pointer transition"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* Tabs */}
              <div className="flex gap-2">
                {(["total", "selected"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setReportTab(tab)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border cursor-pointer transition ${
                      reportTab === tab
                        ? "bg-[#D4AF37] text-slate-950 border-[#D4AF37]"
                        : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
                    }`}
                  >
                    {tab === "total"
                      ? `📊 Reporte Total (${allProspects.length})`
                      : `☑ Seleccionados (${selectedIds.size})`}
                  </button>
                ))}
              </div>

              {/* Report content */}
              {(() => {
                const reportData =
                  reportTab === "total"
                    ? allProspects
                    : allProspects.filter((p) => selectedIds.has(p.id));

                const byCities = Array.from(
                  new Set(reportData.map((p) => p.city))
                ).map((c) => {
                  const cp = reportData.filter((p) => p.city === c);
                  return {
                    city: c,
                    total: cp.length,
                    nuevo: cp.filter((p) => p.outreach_status === "NUEVO").length,
                    enviado: cp.filter((p) => p.outreach_status === "EMAIL_ENVIADO").length,
                    demo: cp.filter((p) => p.outreach_status === "DEMO_AGENDADA").length,
                    convertido: cp.filter((p) => p.outreach_status === "CONVERTIDO").length,
                  };
                });

                return (
                  <>
                    {/* Summary stats */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      {[
                        {
                          label: "Total",
                          value: reportData.length,
                          color: "text-slate-200",
                          bg: "bg-slate-800/80",
                          border: "border-slate-700",
                        },
                        {
                          label: "Nuevos",
                          value: reportData.filter((p) => p.outreach_status === "NUEVO").length,
                          color: "text-slate-300",
                          bg: "bg-slate-800/60",
                          border: "border-slate-700",
                        },
                        {
                          label: "Email Enviado",
                          value: reportData.filter((p) => p.outreach_status === "EMAIL_ENVIADO").length,
                          color: "text-blue-300",
                          bg: "bg-blue-950/50",
                          border: "border-blue-800/50",
                        },
                        {
                          label: "Demo Agendada",
                          value: reportData.filter((p) => p.outreach_status === "DEMO_AGENDADA").length,
                          color: "text-amber-300",
                          bg: "bg-amber-950/50",
                          border: "border-amber-800/50",
                        },
                        {
                          label: "Convertidos",
                          value: reportData.filter((p) => p.outreach_status === "CONVERTIDO").length,
                          color: "text-emerald-300",
                          bg: "bg-emerald-950/50",
                          border: "border-emerald-800/50",
                        },
                      ].map((s) => (
                        <div
                          key={s.label}
                          className={`${s.bg} border ${s.border} rounded-xl p-4 text-center`}
                        >
                          <div className={`text-3xl font-black ${s.color}`}>{s.value}</div>
                          <div className="text-[11px] text-slate-500 mt-1">{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {/* Por ciudad */}
                    {byCities.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-[#F3E5AB] mb-2">
                          📊 Resumen por Ciudad
                        </h4>
                        <div className="overflow-x-auto border border-slate-800 rounded-xl">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-slate-950/60 text-slate-400 text-[11px] uppercase">
                                <th className="text-left px-4 py-3 font-bold">Ciudad</th>
                                <th className="text-center px-3 py-3 font-bold">Total</th>
                                <th className="text-center px-3 py-3 font-bold">Nuevos</th>
                                <th className="text-center px-3 py-3 font-bold text-blue-400">
                                  Enviados
                                </th>
                                <th className="text-center px-3 py-3 font-bold text-amber-400">
                                  Demos
                                </th>
                                <th className="text-center px-3 py-3 font-bold text-emerald-400">
                                  Convertidos
                                </th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/60">
                              {byCities.map((row) => (
                                <tr key={row.city} className="hover:bg-slate-900/40">
                                  <td className="px-4 py-3 font-bold text-white">
                                    📍 {row.city}
                                  </td>
                                  <td className="px-3 py-3 text-center font-black text-slate-200">
                                    {row.total}
                                  </td>
                                  <td className="px-3 py-3 text-center text-slate-400">
                                    {row.nuevo}
                                  </td>
                                  <td className="px-3 py-3 text-center text-blue-400 font-bold">
                                    {row.enviado}
                                  </td>
                                  <td className="px-3 py-3 text-center text-amber-400 font-bold">
                                    {row.demo}
                                  </td>
                                  <td className="px-3 py-3 text-center text-emerald-400 font-bold">
                                    {row.convertido}
                                  </td>
                                </tr>
                              ))}
                              {/* Totales */}
                              <tr className="bg-slate-950/40 border-t-2 border-slate-700">
                                <td className="px-4 py-3 font-black text-[#D4AF37]">
                                  TOTAL
                                </td>
                                <td className="px-3 py-3 text-center font-black text-[#D4AF37]">
                                  {reportData.length}
                                </td>
                                <td className="px-3 py-3 text-center font-black text-slate-300">
                                  {byCities.reduce((s, r) => s + r.nuevo, 0)}
                                </td>
                                <td className="px-3 py-3 text-center font-black text-blue-300">
                                  {byCities.reduce((s, r) => s + r.enviado, 0)}
                                </td>
                                <td className="px-3 py-3 text-center font-black text-amber-300">
                                  {byCities.reduce((s, r) => s + r.demo, 0)}
                                </td>
                                <td className="px-3 py-3 text-center font-black text-emerald-300">
                                  {byCities.reduce((s, r) => s + r.convertido, 0)}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}

                    {/* Lista detallada */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-bold text-slate-300">
                          Lista Detallada ({reportData.length})
                        </h4>
                        <button
                          onClick={() =>
                            exportCSV(
                              reportData,
                              `prospectos_b2b_${reportTab}_${new Date()
                                .toISOString()
                                .split("T")[0]}.csv`
                            )
                          }
                          className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer font-bold"
                        >
                          <FileDown className="w-3.5 h-3.5" />⬇ Exportar CSV
                        </button>
                      </div>
                      <div className="overflow-x-auto border border-slate-800 rounded-xl max-h-72 overflow-y-auto">
                        <table className="w-full text-xs">
                          <thead className="sticky top-0">
                            <tr className="bg-slate-950/90 text-slate-400 text-[11px] uppercase">
                              <th className="text-left px-4 py-3 font-bold">Agencia</th>
                              <th className="text-left px-3 py-3 font-bold">Ciudad</th>
                              <th className="text-left px-3 py-3 font-bold">Gerente</th>
                              <th className="text-left px-3 py-3 font-bold">Email</th>
                              <th className="text-left px-3 py-3 font-bold">Estado</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/60">
                            {reportData.map((p, i) => {
                              const sc = OUTREACH_STATUS_CONFIG[p.outreach_status];
                              return (
                                <tr key={p.id || i} className="hover:bg-slate-900/40">
                                  <td className="px-4 py-2.5 font-bold text-white">
                                    {p.agency_name}
                                  </td>
                                  <td className="px-3 py-2.5 text-slate-400">📍 {p.city}</td>
                                  <td className="px-3 py-2.5 text-slate-300">
                                    {p.manager_name || "—"}
                                  </td>
                                  <td className="px-3 py-2.5 text-slate-400 max-w-[160px] truncate">
                                    {p.email_official || "—"}
                                  </td>
                                  <td className="px-3 py-2.5">
                                    <span
                                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${sc.bg} ${sc.color}`}
                                    >
                                      {sc.label}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          MODAL: WHATSAPP DIRECT OUTREACH (CANAL #1 BOLIVIA)
      ════════════════════════════════════════════════════════════════ */}
      {showWhatsAppModal && whatsAppProspect && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#111622] border border-emerald-700/50 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-[#0c121c]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
                  <MessageSquare className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-black text-white text-base flex items-center gap-2">
                    {whatsAppProspect.agency_name}
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/50">
                      WhatsApp Directo
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    📍 {whatsAppProspect.city} · 📞 {whatsAppProspect.whatsapp_contact || whatsAppProspect.phone_official || "Sin teléfono"}
                    {whatsAppProspect.manager_name && ` · 👤 ${whatsAppProspect.manager_name}`}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowWhatsAppModal(false)}
                className="p-1.5 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Pitch Style Selector */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#F3E5AB]">
                  Enfoque del Mensaje (Especializado para Bolivia):
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {[
                    { id: "sofia_ai", label: "🤖 Sofía IA (24/7)", desc: "No perder leads de noche" },
                    { id: "demo", label: "📅 Invitación Demo", desc: "15 min Zoom / Meet" },
                    { id: "quick_intro", label: "🚀 Presentación", desc: "CRM Inmobiliario AI" },
                  ].map((pt) => (
                    <button
                      key={pt.id}
                      onClick={() => handleRegenerateWAPitch(pt.id as any)}
                      disabled={isGeneratingWAPitch}
                      className={`p-2.5 rounded-xl text-left border transition cursor-pointer ${
                        whatsAppPitchType === pt.id
                          ? "bg-emerald-950/80 border-emerald-500/80 text-emerald-200"
                          : "bg-slate-950 text-slate-400 border-slate-800 hover:text-white"
                      }`}
                    >
                      <div className="font-bold text-xs">{pt.label}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">{pt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Message preview / edit */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">
                    Mensaje de WhatsApp (Editable):
                  </label>
                  <button
                    onClick={() => handleRegenerateWAPitch(whatsAppPitchType)}
                    disabled={isGeneratingWAPitch}
                    className="text-xs text-[#D4AF37] hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {isGeneratingWAPitch ? (
                      <>
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Generando con IA...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3 h-3" />
                        <span>Regenerar con IA</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="relative">
                  <textarea
                    rows={8}
                    value={whatsAppCustomText}
                    onChange={(e) => setWhatsAppCustomText(e.target.value)}
                    placeholder="Escribe o genera tu mensaje de WhatsApp..."
                    className="w-full bg-slate-950 text-slate-200 p-3.5 rounded-xl border border-slate-800 outline-none focus:border-emerald-500 font-sans text-xs leading-relaxed"
                  />
                  {isGeneratingWAPitch && (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm rounded-xl flex items-center justify-center gap-2 text-emerald-400 text-xs font-bold">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sofía IA redactando pitch personalizado para {whatsAppProspect.agency_name}...
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(whatsAppCustomText);
                    setWhatsAppCopied(true);
                    setTimeout(() => setWhatsAppCopied(false), 2500);
                  }}
                  className="flex-1 py-3 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-bold rounded-xl text-xs flex items-center justify-center gap-2 cursor-pointer transition"
                >
                  {whatsAppCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  {whatsAppCopied ? "¡Copiado al Portapapeles!" : "Copiar Texto"}
                </button>

                <button
                  onClick={handleSendWhatsApp}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:brightness-110 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 cursor-pointer transition"
                >
                  <MessageSquare className="w-4 h-4" />
                  💬 Abrir en WhatsApp (1-Clic)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
