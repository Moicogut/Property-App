import React, { useState } from "react";
import {
  LayoutDashboard,
  Building2,
  Activity,
  Webhook,
  Users,
  CheckCircle2,
  PauseCircle,
  RefreshCw,
  Globe,
  Database,
  MessageSquare,
  TrendingUp,
  ShieldCheck,
  LogOut,
  ChevronRight,
  Zap,
} from "lucide-react";
import type { AppUser } from "@/src/types/property";
import { signOut } from "@/src/lib/auth";

/** Email del SuperAdmin — debe coincidir exactamente con auth.ts */
const SUPERADMIN_EMAIL = "rolangutiali.rg@gmail.com";

interface SuperAdminPanelProps {
  currentUser: AppUser;
  onLogout: () => void;
}

// ─────────────────────────── Mock data (reemplazar con queries Supabase reales) ────────────────────────────

const mockAgencies = [
  { id: "org-1", name: "Inmobiliaria Horizonte SRL", city: "Santa Cruz", leadsCount: 128, plan: "PRO", status: "ACTIVA" as const, joinedAt: "2026-01-15" },
  { id: "org-2", name: "Propiedades del Eje",        city: "La Paz",     leadsCount: 64,  plan: "STARTER", status: "ACTIVA" as const, joinedAt: "2026-03-22" },
  { id: "org-3", name: "Casa Real Cochabamba",       city: "Cochabamba", leadsCount: 87,  plan: "PRO", status: "PAUSADA" as const, joinedAt: "2026-02-08" },
  { id: "org-4", name: "Urubó Premium Properties",   city: "Santa Cruz", leadsCount: 215, plan: "ENTERPRISE", status: "ACTIVA" as const, joinedAt: "2026-01-03" },
];

const mockGlobalMetrics = {
  totalLeads: 494,
  whatsappMessages: 12847,
  vectorsIndexed: 1847,
  sofiaResponses: 11230,
  avgResponseMs: 820,
  qualifiedLeads: 347,
};

const mockWebhookLogs = [
  { id: "wh-1", event: "messages.upsert", instance: "PropertyOS-SCZ", phone: "59171234567", status: "PROCESADO", ts: "20:01:33" },
  { id: "wh-2", event: "messages.upsert", instance: "PropertyOS-SCZ", phone: "59178912345", status: "PROCESADO", ts: "20:00:47" },
  { id: "wh-3", event: "connection.update", instance: "PropertyOS-LPZ", phone: "—",          status: "CONECTADO", ts: "19:58:12" },
  { id: "wh-4", event: "messages.upsert", instance: "PropertyOS-CBB", phone: "59169011223", status: "PROCESADO", ts: "19:55:06" },
  { id: "wh-5", event: "messages.upsert", instance: "PropertyOS-SCZ", phone: "59170099887", status: "AI_PAUSADO", ts: "19:50:31" },
];

// ─────────────────────────────────────────────────────────────────────────────────────────

export const SuperAdminPanel: React.FC<SuperAdminPanelProps> = ({ currentUser, onLogout }) => {
  const [activeSection, setActiveSection] = useState<"agencies" | "metrics" | "webhook">("agencies");
  const [agencyStatuses, setAgencyStatuses] = useState<Record<string, "ACTIVA" | "PAUSADA">>(
    Object.fromEntries(mockAgencies.map((a) => [a.id, a.status]))
  );

  // ─── Guard de seguridad estricto ───
  if (currentUser.email !== SUPERADMIN_EMAIL) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center text-center p-8">
        <div>
          <ShieldCheck className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-white text-xl font-bold mb-2">Acceso Denegado</h2>
          <p className="text-slate-400 text-sm">Este panel requiere privilegios de SuperAdmin.</p>
        </div>
      </div>
    );
  }

  const handleToggleAgency = (id: string) => {
    setAgencyStatuses((prev) => ({
      ...prev,
      [id]: prev[id] === "ACTIVA" ? "PAUSADA" : "ACTIVA",
    }));
  };

  const handleLogout = async () => {
    await signOut();
    onLogout();
  };

  const navItems = [
    { id: "agencies" as const, icon: Building2, label: "Gestor de Agencias" },
    { id: "metrics"  as const, icon: Activity,  label: "Métricas de Consumo" },
    { id: "webhook"  as const, icon: Webhook,    label: "Config Webhook" },
  ];

  return (
    <div className="min-h-screen bg-[#0F172A] flex flex-col">
      
      {/* ── SuperAdmin Header ── */}
      <header className="h-16 bg-[#0F172A] border-b border-slate-800 flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-black text-white text-xl shadow-md shadow-emerald-500/20">
            P
          </div>
          <div>
            <h1 className="text-white font-black text-base leading-none">
              PROPERTY <span className="text-slate-400 font-medium text-sm">OS</span>
            </h1>
            <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
              Panel SuperAdmin
            </p>
          </div>

          <div className="ml-4 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs font-bold text-emerald-300">Global Access</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white">{currentUser.fullName}</p>
            <p className="text-[10px] text-slate-400">{currentUser.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-red-900/30 border border-slate-700 hover:border-red-800/50 text-slate-300 hover:text-red-400 rounded-lg text-xs font-bold transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            Salir
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Sidebar Nav ── */}
        <aside className="w-56 bg-[#0B1120] border-r border-slate-800 flex flex-col py-4 px-3 shrink-0">
          <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest px-2 mb-2">
            Control Global
          </p>
          <nav className="space-y-1">
            {navItems.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all text-left ${
                  activeSection === id
                    ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/20"
                    : "text-slate-400 hover:text-white hover:bg-slate-800"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
                {activeSection === id && <ChevronRight className="w-3 h-3 ml-auto" />}
              </button>
            ))}
          </nav>

          <div className="mt-auto px-2 pt-4 border-t border-slate-800">
            <div className="text-[10px] text-slate-600 space-y-1">
              <div className="flex justify-between"><span>Agencias activas</span><span className="text-emerald-400 font-bold">{Object.values(agencyStatuses).filter(s => s === "ACTIVA").length}</span></div>
              <div className="flex justify-between"><span>Total leads</span><span className="text-white font-bold">{mockGlobalMetrics.totalLeads}</span></div>
              <div className="flex justify-between"><span>Vectores 1536d</span><span className="text-emerald-400 font-bold">{mockGlobalMetrics.vectorsIndexed.toLocaleString()}</span></div>
            </div>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950/30">
          
          {/* ── SECTION 1: Gestor de Agencias ── */}
          {activeSection === "agencies" && (
            <div className="space-y-4 max-w-5xl">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-400" />
                  Gestor de Agencias Inmobiliarias
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Control de licencias, suscripciones y estado operativo de cada agencia.
                </p>
              </div>

              <div className="grid gap-3">
                {mockAgencies.map((agency) => {
                  const status = agencyStatuses[agency.id];
                  return (
                    <div
                      key={agency.id}
                      className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between gap-4 hover:border-slate-700 transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-base ${
                          status === "ACTIVA" ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-700 text-slate-500"
                        }`}>
                          {agency.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{agency.name}</p>
                          <p className="text-[11px] text-slate-400">
                            {agency.city} · Desde {agency.joinedAt}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-6 text-center hidden md:flex">
                        <div>
                          <p className="text-lg font-black text-white">{agency.leadsCount}</p>
                          <p className="text-[10px] text-slate-500">Leads</p>
                        </div>
                        <div>
                          <span className={`text-[10px] font-black px-2 py-1 rounded-full border ${
                            agency.plan === "ENTERPRISE" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                            agency.plan === "PRO" ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                            "bg-slate-700 text-slate-400 border-slate-600"
                          }`}>
                            {agency.plan}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 ${
                          status === "ACTIVA"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                        }`}>
                          {status === "ACTIVA" ? <CheckCircle2 className="w-3 h-3" /> : <PauseCircle className="w-3 h-3" />}
                          {status}
                        </span>
                        <button
                          onClick={() => handleToggleAgency(agency.id)}
                          className={`px-3 py-1.5 rounded-lg text-[10px] font-black border transition-all ${
                            status === "ACTIVA"
                              ? "bg-slate-800 hover:bg-amber-900/20 border-slate-700 hover:border-amber-800/50 text-slate-300 hover:text-amber-400"
                              : "bg-emerald-900/20 hover:bg-emerald-900/40 border-emerald-800/50 text-emerald-400"
                          }`}
                        >
                          {status === "ACTIVA" ? "Pausar" : "Activar"}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── SECTION 2: Métricas de Consumo ── */}
          {activeSection === "metrics" && (
            <div className="space-y-5 max-w-5xl">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  Métricas de Consumo Global
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Actividad consolidada de todas las agencias en tiempo real.</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: "Total Leads Pipeline", value: mockGlobalMetrics.totalLeads, icon: Users, color: "emerald", suffix: "" },
                  { label: "Mensajes WhatsApp", value: mockGlobalMetrics.whatsappMessages.toLocaleString(), icon: MessageSquare, color: "blue", suffix: "" },
                  { label: "Vectores 1536d Indexados", value: mockGlobalMetrics.vectorsIndexed.toLocaleString(), icon: Database, color: "purple", suffix: "" },
                  { label: "Respuestas Sofía IA", value: mockGlobalMetrics.sofiaResponses.toLocaleString(), icon: Zap, color: "emerald", suffix: "" },
                  { label: "Leads Calificados", value: mockGlobalMetrics.qualifiedLeads, icon: CheckCircle2, color: "emerald", suffix: "" },
                  { label: "Latencia Promedio", value: mockGlobalMetrics.avgResponseMs, icon: Activity, color: "blue", suffix: "ms" },
                ].map(({ label, value, icon: Icon, color, suffix }) => (
                  <div key={label} className={`bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 transition-all`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-3 ${
                      color === "emerald" ? "bg-emerald-500/10" : color === "blue" ? "bg-blue-500/10" : "bg-purple-500/10"
                    }`}>
                      <Icon className={`w-4 h-4 ${
                        color === "emerald" ? "text-emerald-400" : color === "blue" ? "text-blue-400" : "text-purple-400"
                      }`} />
                    </div>
                    <p className="text-2xl font-black text-white">{value}{suffix}</p>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5 uppercase tracking-wider">{label}</p>
                  </div>
                ))}
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  Distribución por Ciudad
                </h3>
                <div className="space-y-3">
                  {[
                    { city: "Santa Cruz", leads: 312, pct: 63 },
                    { city: "La Paz",     leads: 112, pct: 23 },
                    { city: "Cochabamba", leads: 70,  pct: 14 },
                  ].map(({ city, leads, pct }) => (
                    <div key={city}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-300 font-medium">{city}</span>
                        <span className="text-slate-400">{leads} leads ({pct}%)</span>
                      </div>
                      <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── SECTION 3: Config Webhook ── */}
          {activeSection === "webhook" && (
            <div className="space-y-5 max-w-5xl">
              <div>
                <h2 className="text-lg font-black text-white flex items-center gap-2">
                  <Webhook className="w-5 h-5 text-emerald-400" />
                  Estado y Configuración del Webhook
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Conexión con Evolution API y log de mensajes recibidos en tiempo real.</p>
              </div>

              {/* Connection Status Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { instance: "PropertyOS-SCZ", city: "Santa Cruz", status: "CONECTADO" },
                  { instance: "PropertyOS-LPZ", city: "La Paz",     status: "CONECTADO" },
                  { instance: "PropertyOS-CBB", city: "Cochabamba", status: "CONECTADO" },
                ].map(({ instance, city, status }) => (
                  <div key={instance} className="bg-slate-900 border border-emerald-500/20 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{city}</span>
                      <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_6px_#10B981]" />
                        <span className="text-[10px] font-bold text-emerald-400">{status}</span>
                      </div>
                    </div>
                    <p className="text-sm font-bold text-white font-mono">{instance}</p>
                    <button className="mt-2 flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 transition-colors">
                      <RefreshCw className="w-3 h-3" /> Reconectar
                    </button>
                  </div>
                ))}
              </div>

              {/* Webhook URL */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">URL del Webhook (Evolution API → Property OS)</p>
                <div className="bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 font-mono text-xs text-emerald-400 flex justify-between items-center">
                  <span>https://property-app-chi.vercel.app/api/whatsapp/webhook</span>
                  <span className="text-slate-600 text-[10px]">POST</span>
                </div>
              </div>

              {/* Recent Webhook Logs */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-bold text-white">Log de Webhooks Recientes</h3>
                  <span className="text-[10px] text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full font-bold">Live</span>
                </div>
                <div className="space-y-2">
                  {mockWebhookLogs.map((log) => (
                    <div key={log.id} className="flex items-center justify-between text-xs bg-slate-950/50 rounded-lg px-3 py-2 border border-slate-800">
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                          log.status === "AI_PAUSADO" ? "bg-amber-500" :
                          log.status === "CONECTADO" ? "bg-blue-500" : "bg-emerald-500"
                        }`} />
                        <span className="font-mono text-slate-400">{log.phone}</span>
                        <span className="text-slate-600">{log.event}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`font-bold ${
                          log.status === "AI_PAUSADO" ? "text-amber-400" :
                          log.status === "CONECTADO" ? "text-blue-400" : "text-emerald-400"
                        }`}>{log.status}</span>
                        <span className="text-slate-600 font-mono">{log.ts}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
};
