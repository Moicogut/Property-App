import React, { useState, useEffect } from "react";
import { 
  Building2, 
  LayoutDashboard, 
  Kanban, 
  Database, 
  MessageSquare, 
  Settings, 
  HelpCircle, 
  Search, 
  Bell, 
  Plus, 
  MoreHorizontal, 
  Flame, 
  CheckCircle2, 
  Calendar, 
  Phone, 
  Bot, 
  Sparkles,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  Building,
  UserCheck,
  Filter,
  MapPin,
  ChevronDown,
  XCircle,
  FileText,
  LogOut,
  Shield,
} from "lucide-react";

import { Lead, Property, PipelineStage, AppUser, AppView } from "@/src/types/property";
import { ChatDrawer } from "@/src/components/chat/ChatDrawer";
import { RagInventoryView } from "@/src/components/rag/RagInventoryView";
import { NewLeadModal } from "@/src/components/modals/NewLeadModal";
import { AppointmentModal } from "@/src/components/modals/AppointmentModal";
import { PdfFichaModal } from "@/src/components/modals/PdfFichaModal";
import { LoginPage } from "@/src/components/auth/LoginPage";
import { SuperAdminPanel } from "@/src/components/admin/SuperAdminPanel";
import { getCurrentUser, onAuthStateChange, signOut } from "@/src/lib/auth";
import { AppHeader } from "@/src/components/layout/AppHeader";
import { KanbanBoard } from "@/src/components/kanban/KanbanBoard";

import { supabase } from "@/src/lib/supabase";

const loadDataFromSupabase = async (
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>,
  setProperties: React.Dispatch<React.SetStateAction<Property[]>>
) => {
  const { data: leadsData, error: leadsErr } = await supabase.from('leads').select('*, matchedProperty:properties(*), appointments(*)').order('created_at', { ascending: false });
  console.log("[App] leadsData:", leadsData, "error:", leadsErr);
  if (leadsData) {
    const mappedLeads: Lead[] = leadsData.map((l: any) => ({
      id: l.id,
      organizationId: l.organization_id || "org-1",
      phoneNumber: l.phone_number,
      fullName: l.full_name,
      pipelineStage: l.pipeline_stage,
      budgetMaxUsd: l.bant_score?.budget || Number(l.budget_max_usd) || 0,
      paymentMethod: l.payment_method,
      hasDownPayment: l.has_down_payment ?? false,
      downPaymentPercent: l.down_payment_percent || 20,
      downPaymentBank: l.down_payment_bank || "Banco BCP",
      preferredZone: l.preferred_zone || l.bant_score?.preferred_zone || "Por definir",
      matchedProperty: l.matchedProperty ? {
        id: l.matchedProperty.id,
        organizationId: l.matchedProperty.organization_id,
        title: l.matchedProperty.title,
        city: l.matchedProperty.city,
        zone: l.matchedProperty.zone,
        priceUsd: Number(l.matchedProperty.price_usd),
        bedrooms: l.matchedProperty.bedrooms,
        bathrooms: l.matchedProperty.bathrooms,
        areaSqm: Number(l.matchedProperty.area_sqm),
        acceptsSocialHousing: l.matchedProperty.accepts_social_housing,
        status: l.matchedProperty.status,
        rawDescription: l.matchedProperty.raw_description,
        imageUrl: l.matchedProperty.image_url,
        vectorIndexed: true,
        vectorDimensions: 1536,
      } : undefined,
      aiSummary: l.ai_summary || "Lead calificado por Sofía IA",
      aiPaused: l.ai_paused ?? false,
      intentScore: l.intent_score || 85,
      bantScore: l.bant_score ? {
        budget: Number(l.bant_score.budget || 0),
        authority: Boolean(l.bant_score.authority),
        need: String(l.bant_score.need || ""),
        timeline: String(l.bant_score.timeline || ""),
        score: Number(l.bant_score.score || 0)
      } : undefined,
      createdAt: new Date(l.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      appointmentDate: l.appointments && l.appointments.length > 0 ? l.appointments[0].appointment_date : undefined,
    }));
    setLeads(mappedLeads);
  }

  const { data: propsData } = await supabase.from('properties').select('*').order('id', { ascending: false });
  if (propsData) {
    const mappedProps: Property[] = propsData.map((p: any) => ({
      id: p.id,
      organizationId: p.organization_id || "org-1",
      title: p.title,
      city: p.city,
      zone: p.zone,
      priceUsd: Number(p.price_usd),
      bedrooms: p.bedrooms,
      bathrooms: p.bathrooms,
      areaSqm: Number(p.area_sqm),
      acceptsSocialHousing: p.accepts_social_housing,
      status: p.status,
      rawDescription: p.raw_description,
      imageUrl: p.image_url,
      vectorIndexed: true,
      vectorDimensions: 1536,
    }));
    setProperties(mappedProps);
  }
};

export default function App() {
  // ── Auth State ─────────────────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentView, setCurrentView] = useState<AppView>("pipeline");

  // ── Tabs de navegación ──────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"pipeline" | "rag" | "dashboard" | "chat">("pipeline");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  // UI Controls
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [leadForAppointment, setLeadForAppointment] = useState<Lead | null>(null);
  const [leadForPdf, setLeadForPdf] = useState<Lead | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("TODAS");
  const [visOnlyFilter, setVisOnlyFilter] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Responsive State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Función de carga dinámica de Leads desde Supabase
  const loadLeadsFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from("leads")
        .select("*, matchedProperty:properties(*)")
        .order("created_at", { ascending: false });

      if (!error && data && data.length > 0) {
        const mappedLeads: Lead[] = data.map((l: any) => ({
          id: l.id,
          organizationId: l.organization_id || "org-1",
          phoneNumber: l.phone_number,
          fullName: l.full_name,
          pipelineStage: l.pipeline_stage,
          budgetMaxUsd: l.bant_score?.budget || Number(l.budget_max_usd) || 0,
          paymentMethod: l.payment_method,
          hasDownPayment: l.has_down_payment ?? false,
          downPaymentPercent: l.down_payment_percent || 20,
          downPaymentBank: l.down_payment_bank || "Banco BCP",
          preferredZone: l.preferred_zone || l.bant_score?.preferred_zone || "Por definir",
          matchedProperty: l.matchedProperty ? {
            id: l.matchedProperty.id,
            organizationId: l.matchedProperty.organization_id,
            title: l.matchedProperty.title,
            city: l.matchedProperty.city,
            zone: l.matchedProperty.zone,
            priceUsd: Number(l.matchedProperty.price_usd),
            bedrooms: l.matchedProperty.bedrooms,
            bathrooms: l.matchedProperty.bathrooms,
            areaSqm: Number(l.matchedProperty.area_sqm),
            acceptsSocialHousing: l.matchedProperty.accepts_social_housing,
            status: l.matchedProperty.status,
            rawDescription: l.matchedProperty.raw_description,
            imageUrl: l.matchedProperty.image_url,
            vectorIndexed: true,
            vectorDimensions: 1536,
          } : undefined,
          aiSummary: l.ai_summary || "Lead calificado por Sofía IA",
          aiPaused: l.ai_paused ?? false,
          intentScore: l.intent_score || 85,
          bantScore: l.bant_score ? {
            budget: Number(l.bant_score.budget || 0),
            authority: Boolean(l.bant_score.authority),
            need: String(l.bant_score.need || ""),
            timeline: String(l.bant_score.timeline || ""),
            score: Number(l.bant_score.score || 0)
          } : undefined,
          createdAt: new Date(l.created_at || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }));
        setLeads(mappedLeads);
      }
    } catch (e) {
      console.warn("[App] Error cargando leads desde Supabase DB:", e);
    }
  };

  // Función de carga dinámica de Propiedades desde Supabase
  const loadPropertiesFromSupabase = async () => {
    try {
      const { data, error } = await supabase
        .from("properties")
        .select("*")
        .order("id", { ascending: false });

      if (error) {
        // Exponer el error completo para diagnóstico en Vercel Logs / DevTools
        console.error("[App] Supabase error cargando properties:", JSON.stringify(error));
        return;
      }

      // Actualizar siempre el estado (incluso si data=[] para limpiar el seed inicial)
      const mappedProps: Property[] = (data ?? []).map((p: any) => ({
        id: p.id,
        organizationId: p.organization_id || "org-1",
        title: p.title,
        city: p.city,
        zone: p.zone,
        priceUsd: Number(p.price_usd),
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        areaSqm: Number(p.area_sqm),
        acceptsSocialHousing: p.accepts_social_housing,
        status: p.status,
        rawDescription: p.raw_description,
        imageUrl: p.image_url,
        vectorIndexed: true,
        vectorDimensions: 1536,
      }));
      console.log(`[App] ${mappedProps.length} propiedades cargadas desde Supabase.`);
      setProperties(mappedProps);
    } catch (e) {
      console.error("[App] Excepción cargando propiedades desde Supabase DB:", e);
    }
  };

  // Rehidratar sesión activa y configurar Supabase Realtime Subscription
  useEffect(() => {
    // Las propiedades son datos públicos — cargar siempre, sin depender de sesión
    loadPropertiesFromSupabase();

    getCurrentUser().then((user) => {
      setCurrentUser(user);
      // 🔥 Forzar carga en modo test (incluso sin sesión)
      loadDataFromSupabase(setLeads, setProperties);
      setAuthLoading(false);
    });

    const unsubscribe = onAuthStateChange((user) => {
      setCurrentUser(user);
      // 🔥 Forzar carga en modo test (incluso sin sesión)
      loadDataFromSupabase(setLeads, setProperties);
      loadPropertiesFromSupabase();
      setAuthLoading(false);
    });

    // ⚡ Supabase Realtime Subscription para la tabla `leads`
    const channel = supabase
      .channel("realtime-leads-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, (_payload) => {
        console.log("⚡ Supabase Realtime update detectado en tabla leads — recargando Kanban en vivo...");
        loadLeadsFromSupabase();
      })
      .subscribe();

    return () => {
      unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  // Suscripción Realtime
  useEffect(() => {
    const channel = supabase.channel('realtime-leads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        // Al haber cualquier cambio en leads, recargar desde DB (para mantener simplicidad y uniones correctas)
        loadDataFromSupabase(setLeads, setProperties);
      })
      .subscribe();
    
    return () => { supabase.removeChannel(channel); };
  }, [currentUser]);

  const handleLogout = async () => {
    await signOut();
    setCurrentUser(null);
    setCurrentView("pipeline");
  };

  const handleDeleteLead = async (leadId: string) => {
    if (window.confirm("¿Estás seguro que deseas eliminar este cliente y todo su historial?")) {
      const { error } = await supabase.from('leads').delete().eq('id', leadId);
      if (!error) {
        setLeads(prev => prev.filter(l => l.id !== leadId));
      } else {
        alert("Error eliminando lead: " + error.message);
      }
    }
  };

  const handleEditLead = async (lead: Lead) => {
    const newName = window.prompt("Editar Nombre del Cliente", lead.fullName);
    if (newName && newName !== lead.fullName) {
      const { error } = await supabase.from('leads').update({ full_name: newName }).eq('id', lead.id);
      if (!error) {
        setLeads(prev => prev.map(l => l.id === lead.id ? { ...l, fullName: newName } : l));
      } else {
        alert("Error editando lead: " + error.message);
      }
    }
  };

  // ── Loading splash ──────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#0F172A] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center font-black text-white text-2xl shadow-xl mx-auto mb-3 animate-pulse">P</div>
          <p className="text-slate-400 text-sm">Cargando Property OS...</p>
        </div>
      </div>
    );
  }

  // ── Auth Guard: mostrar Login si no hay sesión activa ───────────────────────
  if (!currentUser) {
    return <LoginPage onAuthSuccess={(user) => { setCurrentUser(user); setCurrentView("pipeline"); }} />;
  }

  // ── Admin Guard: mostrar SuperAdmin Panel ───────────────────────────────────
  if (currentView === "admin") {
    return <SuperAdminPanel currentUser={currentUser} onLogout={handleLogout} />;
  }

  // Handlers
  const handleOpenChat = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDrawerOpen(true);
  };

  const handleToggleAiPause = async (leadId: string, isPaused: boolean) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, aiPaused: isPaused } : l))
    );
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead((prev) => (prev ? { ...prev, aiPaused: isPaused } : null));
    }
    await supabase.from("leads").update({ ai_paused: isPaused }).eq("id", leadId);
  };

  const handleAddLead = async (newLead: Lead) => {
    setLeads((prev) => [newLead, ...prev]);
    await supabase.from("leads").insert({
      organization_id: newLead.organizationId,
      phone_number: newLead.phoneNumber,
      full_name: newLead.fullName,
      pipeline_stage: newLead.pipelineStage,
      budget_max_usd: newLead.budgetMaxUsd,
      payment_method: newLead.paymentMethod,
      has_down_payment: newLead.hasDownPayment,
      down_payment_percent: newLead.downPaymentPercent,
      down_payment_bank: newLead.downPaymentBank,
      preferred_zone: newLead.preferredZone,
      property_interest_id: newLead.propertyInterestId,
      ai_summary: newLead.aiSummary,
      ai_paused: newLead.aiPaused,
      intent_score: newLead.intentScore
    });
  };

  const handleAddProperty = async (newProp: Partial<Property>) => {
    const created: Property = {
      id: `prop-${Date.now()}`,
      organizationId: "org-1",
      title: newProp.title || "Nueva Propiedad",
      city: newProp.city || "Santa Cruz",
      zone: newProp.zone || "Equipetrol",
      priceUsd: newProp.priceUsd || 90000,
      bedrooms: newProp.bedrooms || 2,
      bathrooms: newProp.bathrooms || 2,
      areaSqm: newProp.areaSqm || 70,
      acceptsSocialHousing: newProp.acceptsSocialHousing ?? true,
      status: "AVAILABLE",
      rawDescription: newProp.rawDescription || "Ficha inmobiliaria cargada en el motor RAG.",
      imageUrl: newProp.imageUrl || "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?q=80&w=800",
      vectorIndexed: true,
      vectorDimensions: 768,
    };
    setProperties((prev) => [created, ...prev]);
    
    await fetch("/api/properties", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(created)
    });
  };

  const handleUpdateProperty = async (id: string, updates: Partial<Property>) => {
    setProperties((prev) => 
      prev.map(p => p.id === id ? { ...p, ...updates } : p)
    );
    
    const dbUpdates: any = {};
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.city !== undefined) dbUpdates.city = updates.city;
    if (updates.zone !== undefined) dbUpdates.zone = updates.zone;
    if (updates.priceUsd !== undefined) dbUpdates.price_usd = updates.priceUsd;
    if (updates.bedrooms !== undefined) dbUpdates.bedrooms = updates.bedrooms;
    if (updates.bathrooms !== undefined) dbUpdates.bathrooms = updates.bathrooms;
    if (updates.areaSqm !== undefined) dbUpdates.area_sqm = updates.areaSqm;
    if (updates.acceptsSocialHousing !== undefined) dbUpdates.accepts_social_housing = updates.acceptsSocialHousing;
    if (updates.rawDescription !== undefined) dbUpdates.raw_description = updates.rawDescription;
    if (updates.images !== undefined) dbUpdates.images = updates.images;
    
    if (Object.keys(dbUpdates).length > 0) {
      await supabase.from("properties").update(dbUpdates).eq("id", id);
    }
  };

  const handleDeleteProperty = async (id: string) => {
    setProperties((prev) => prev.filter(p => p.id !== id));
    await supabase.from("properties").delete().eq("id", id);
  };

  const handleMoveStage = async (leadId: string, newStage: PipelineStage) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, pipelineStage: newStage } : l))
    );
    await supabase.from("leads").update({ pipeline_stage: newStage }).eq("id", leadId);
  };

  const handleConfirmAppointment = async (leadId: string, details: { date: string; time: string; agent: string; notes: string }) => {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? {
              ...l,
              pipelineStage: "VISITA_AGENDADA",
              aiSummary: `Visita agendada para el ${details.date} a las ${details.time} con ${details.agent}.`,
            }
          : l
      )
    );

    // Save to database
    await supabase.from("leads").update({ 
      pipeline_stage: "VISITA_AGENDADA",
      ai_summary: `Visita agendada para el ${details.date} a las ${details.time} con ${details.agent}.`
    }).eq("id", leadId);
  };

  // Dynamic Filtering
  const filteredLeads = leads.filter((l) => {
    const matchesSearch = 
      l.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.phoneNumber.includes(searchQuery) ||
      l.preferredZone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.budgetMaxUsd.toString().includes(searchQuery);

    const matchesCity = 
      selectedCity === "TODAS" ||
      (l.matchedProperty && l.matchedProperty.city === selectedCity) ||
      l.preferredZone.toLowerCase().includes(selectedCity.toLowerCase());

    const matchesVis = !visOnlyFilter || l.paymentMethod === "CREDITO_VIS";

    return matchesSearch && matchesCity && matchesVis;
  });


  return (
    <div className="flex flex-col h-screen w-full bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden">
      
      {/* 1. TOP EXECUTIVE HEADER - "Professional Polish" Theme */}
      <AppHeader
        currentUser={currentUser}
        onLogout={handleLogout}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        selectedCity={selectedCity}
        setSelectedCity={setSelectedCity}
        setIsNewLeadModalOpen={setIsNewLeadModalOpen}
        setActiveTab={setActiveTab}
        showNotifications={showNotifications}
        setShowNotifications={setShowNotifications}
        setCurrentView={setCurrentView}
      />

      {/* 2. SUB-BAR NAVIGATION / TABS */}
      <div className="bg-[#0F172A] border-b border-slate-800 px-2 md:px-6 py-2 flex items-center justify-between shrink-0 overflow-x-auto custom-scrollbar">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab("pipeline")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "pipeline"
                ? "bg-emerald-500 text-slate-950 shadow"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Kanban Pipeline</span>
            <span className="px-1.5 py-0.2 bg-slate-900/40 rounded text-[10px] font-mono">
              {filteredLeads.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("rag")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "rag"
                ? "bg-emerald-500 text-slate-950 shadow"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Inventario RAG</span>
            <span className="px-1.5 py-0.2 bg-slate-900/40 rounded text-[10px] font-mono">
              {properties.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "dashboard"
                ? "bg-emerald-500 text-slate-950 shadow"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>KPIs Executive</span>
          </button>

          <button
            onClick={() => setActiveTab("chat")}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "chat"
                ? "bg-emerald-500 text-slate-950 shadow"
                : "text-slate-400 hover:text-white hover:bg-slate-800"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Central Chat</span>
          </button>
        </div>

        {/* Quick VIS Toggle Filter */}
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <label className="flex items-center gap-1.5 cursor-pointer bg-slate-800 px-2.5 py-1 rounded-md border border-slate-700">
            <input
              type="checkbox"
              checked={visOnlyFilter}
              onChange={(e) => setVisOnlyFilter(e.target.checked)}
              className="w-3.5 h-3.5 text-emerald-500 rounded border-slate-600 focus:ring-emerald-500"
            />
            <span className="text-[11px] font-semibold">Solo Crédito VIS (ASFI)</span>
          </label>
        </div>
      </div>

      {/* 3. MAIN WORKSPACE VIEW ROUTER */}
      <main className="flex-1 overflow-hidden relative">
        
        {/* VIEW 1: KANBAN BOARD */}
        {activeTab === "pipeline" && (
          <KanbanBoard
            leads={filteredLeads}
            onOpenChat={handleOpenChat}
            onEditLead={handleEditLead}
            onDeleteLead={handleDeleteLead}
            onMoveStage={handleMoveStage}
            onOpenAppointmentModal={(lead) => {
              setLeadForAppointment(lead);
              setIsAppointmentModalOpen(true);
            }}
          />
        )}

        {/* VIEW 2: RAG INVENTORY */}
        {activeTab === "rag" && (
          <RagInventoryView
            properties={properties}
            onAddProperty={handleAddProperty}
            onUpdateProperty={handleUpdateProperty}
            onDeleteProperty={handleDeleteProperty}
          />
        )}

        {/* VIEW 3: EXECUTIVE DASHBOARD */}
        {activeTab === "dashboard" && (
          <div className="p-6 space-y-6 bg-slate-50 overflow-y-auto h-full max-w-7xl mx-auto">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Métricas Principales Property OS</h2>
              <p className="text-xs text-slate-500">Métricas en tiempo real sincronizadas con Evolution API</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Total Leads En Pipeline</span>
                <p className="text-3xl font-extrabold text-slate-900 mt-2">{leads.length}</p>
                <span className="text-xs text-emerald-600 font-bold mt-1 block">82% Autogestionados por Sofía IA</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Citas VIS Agendadas</span>
                <p className="text-3xl font-extrabold text-emerald-600 mt-2">
                  {leads.filter(l => l.pipelineStage === 'CALIFICADO_VISITA_PENDIENTE' || l.pipelineStage === 'VISITA_REALIZADA' || l.pipelineStage === 'VISITA_AGENDADA').length}
                </p>
                <span className="text-xs text-slate-500 mt-1 block">15% Aporte propio verificado</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Propiedades Vectorizadas</span>
                <p className="text-3xl font-extrabold text-slate-900 mt-2">{properties.length}</p>
                <span className="text-xs text-emerald-600 font-bold mt-1 block">1536d Embeddings PostgreSQL</span>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Velocidad de Ingesta</span>
                <p className="text-3xl font-extrabold text-slate-900 mt-2">0.8s</p>
                <span className="text-xs text-emerald-600 font-bold mt-1 block">Latencia ultrabajo en WhatsApp</span>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm mb-4">Actividad Reciente del Agente Sofía</h3>
              <div className="space-y-3 text-xs text-slate-600">
                {leads.slice(0, 4).map((lead) => (
                  <div key={lead.id} className="p-3 bg-slate-50 rounded-xl flex items-center justify-between border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-900">Lead {lead.fullName} calificado automáticamente</p>
                      <p className="text-slate-500">{lead.aiSummary}</p>
                    </div>
                    <span className="text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                      Score {lead.intentScore} 🔥
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* VIEW 4: CHAT CENTRAL */}
        {activeTab === "chat" && (
          <div className="p-6 bg-slate-50 h-full overflow-y-auto max-w-7xl mx-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-1">Central de Conversaciones WhatsApp</h2>
            <p className="text-xs text-slate-500 mb-6">Selecciona un cliente para intervenir en vivo el chat con el Agente Sofía.</p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leads.map((lead) => (
                <div 
                  key={lead.id}
                  onClick={() => handleOpenChat(lead)}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md cursor-pointer transition-all space-y-3"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-slate-900 text-sm">{lead.fullName}</h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${lead.aiPaused ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                      {lead.aiPaused ? "Pausado (Agente)" : "IA Sofia Activa"}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    "{lead.aiSummary}"
                  </p>

                  <div className="flex justify-between items-center text-xs pt-1">
                    <span className="font-bold text-slate-900">${(lead.budgetMaxUsd ?? 0).toLocaleString()} USD</span>
                    <span className="text-emerald-600 font-bold">Abrir Chat →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </main>

      {/* 4. MODALS & DRAWERS */}
      
      {/* Live Chat Intervention Drawer */}
      <ChatDrawer
        isOpen={isDrawerOpen}
        lead={selectedLead}
        onClose={() => setIsDrawerOpen(false)}
        onToggleAiPause={handleToggleAiPause}
        onConfirmAppointment={handleConfirmAppointment}
      />

      {/* New Lead Creation Modal */}
      <NewLeadModal
        isOpen={isNewLeadModalOpen}
        onClose={() => setIsNewLeadModalOpen(false)}
        onAddLead={handleAddLead}
        properties={properties}
      />

      {/* Appointment Scheduler Modal */}
      <AppointmentModal
        isOpen={isAppointmentModalOpen}
        lead={leadForAppointment}
        onClose={() => {
          setIsAppointmentModalOpen(false);
          setLeadForAppointment(null);
        }}
        onConfirmAppointment={handleConfirmAppointment}
      />

      {/* PDF Reservation Voucher Modal */}
      <PdfFichaModal
        isOpen={isPdfModalOpen}
        lead={leadForPdf}
        onClose={() => {
          setIsPdfModalOpen(false);
          setLeadForPdf(null);
        }}
      />

    </div>
  );
}
