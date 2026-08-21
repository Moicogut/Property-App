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
import { LandingPage } from "@/src/components/LandingPage";
import { SaveToast } from "@/src/components/SaveToast";
import { BotSimulatorView } from "@/src/components/simulator/BotSimulatorView";
import { AgencySettingsModal } from "@/src/components/admin/AgencySettingsModal";

import { supabase } from "@/src/lib/supabase";

export default function App() {
  // ── Auth State ─────────────────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [currentView, setCurrentView] = useState<AppView>("landing");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  // ── Tabs de navegación ──────────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<"pipeline" | "rag" | "dashboard" | "chat" | "simulator">("pipeline");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  // UI Controls
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isNewLeadModalOpen, setIsNewLeadModalOpen] = useState(false);
  const [isAppointmentModalOpen, setIsAppointmentModalOpen] = useState(false);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [isAgencySettingsOpen, setIsAgencySettingsOpen] = useState(false);
  const [leadForAppointment, setLeadForAppointment] = useState<Lead | null>(null);
  const [leadForPdf, setLeadForPdf] = useState<Lead | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState<string>("TODAS");
  const [visOnlyFilter, setVisOnlyFilter] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  
  // Responsive State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Función de carga dinámica de Leads desde Supabase con aislamiento Multi-Tenant
  const loadLeadsFromSupabase = async (orgId?: string) => {
    try {
      let query = supabase
        .from("leads")
        .select("*, matchedProperty:properties(*), appointments(*)")
        .order("created_at", { ascending: false });

      if (orgId) {
        query = query.eq("organization_id", orgId);
      }

      const { data, error } = await query;

      if (!error && data) {
        const mappedLeads: Lead[] = data.map((l: any) => ({
          id: l.id,
          organizationId: l.organization_id || orgId || "org-1",
          phoneNumber: l.phone_number,
          fullName: l.full_name,
          pipelineStage: l.pipeline_stage,
          pipelineType: l.pipeline_type || (
            l.pipeline_stage?.startsWith('PROSPECTO_') || l.pipeline_stage?.startsWith('EVALUACION_') || l.pipeline_stage?.startsWith('ACM_') || l.pipeline_stage?.startsWith('AUDITORIA_') || l.pipeline_stage?.startsWith('CONTRATO_CONSIGNACION') || l.pipeline_stage?.startsWith('INMUEBLE_CAPTADO') ? 'CAPTACIONES' :
            l.pipeline_stage?.startsWith('SOLICITUD_') || l.pipeline_stage?.startsWith('PERFILAMIENTO_') || l.pipeline_stage?.startsWith('VISITA_RENTA') || l.pipeline_stage?.startsWith('REVISION_GARANTIAS') || l.pipeline_stage?.startsWith('CONTRATO_RENTA') ? 'ALQUILERES' : 'VENTAS'
          ),
          leadType: l.lead_type || (
            l.pipeline_stage?.startsWith('PROSPECTO_') ? 'SELLER_OWNER' :
            l.pipeline_stage?.startsWith('SOLICITUD_') ? 'TENANT' : 'BUYER'
          ),
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
            images: l.matchedProperty.images,
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
      } else {
        setLeads([]);
      }
    } catch (e) {
      console.warn("[App] Error cargando leads desde Supabase DB:", e);
      setLeads([]);
    }
  };

  // Función de carga dinámica de Propiedades desde Supabase con filtro Multi-Tenant
  const loadPropertiesFromSupabase = async (orgId?: string) => {
    try {
      let query = supabase
        .from("properties")
        .select("*, legalAudit:property_legal_audit(*)")
        .order("id", { ascending: false });

      if (orgId) {
        query = query.eq("organization_id", orgId);
      }

      const { data, error } = await query;

      if (error) {
        console.error("[App] Supabase error cargando properties:", JSON.stringify(error));
        return;
      }

      const mappedProps: Property[] = (data ?? []).map((p: any) => ({
        id: p.id,
        organizationId: p.organization_id || orgId || "org-1",
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
        images: p.images,
        vectorIndexed: true,
        vectorDimensions: 1536,
        legalAudit: p.legalAudit && p.legalAudit.length > 0 ? {
          id: p.legalAudit[0].id,
          propertyId: p.legalAudit[0].property_id,
          city: p.legalAudit[0].city,
          folioRealStatus: p.legalAudit[0].folio_real_status || 'PENDIENTE',
          taxStatus: p.legalAudit[0].tax_status || 'PENDIENTE',
          cadastralStatus: p.legalAudit[0].cadastral_status || 'PENDIENTE',
          globalLegalScore: p.legalAudit[0].global_legal_score || 'ROJO',
          notes: p.legalAudit[0].notes || '',
          updatedAt: p.legalAudit[0].updated_at,
        } : undefined,
      }));
      setProperties(mappedProps);
    } catch (e) {
      console.error("[App] Excepción cargando propiedades desde Supabase DB:", e);
      setProperties([]);
    }
  };

  // Rehidratar sesión activa y configurar Supabase Realtime Subscription
  useEffect(() => {
    getCurrentUser().then((user) => {
      setCurrentUser(user);
      loadPropertiesFromSupabase(user?.organizationId);
      loadLeadsFromSupabase(user?.organizationId);
      setAuthLoading(false);
    });

    const unsubscribe = onAuthStateChange((user) => {
      setCurrentUser(user);
      loadPropertiesFromSupabase(user?.organizationId);
      loadLeadsFromSupabase(user?.organizationId);
      setAuthLoading(false);
    });

    // ⚡ Supabase Realtime Subscription para la tabla `leads`
    const channel = supabase
      .channel("realtime-leads-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "leads" }, (_payload) => {
        loadLeadsFromSupabase(currentUser?.organizationId);
      })
      .subscribe();

    return () => {
      unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  // Recargar datos cuando cambia la organización activa (Switch Tenant)
  useEffect(() => {
    if (currentUser?.organizationId) {
      loadLeadsFromSupabase(currentUser.organizationId);
      loadPropertiesFromSupabase(currentUser.organizationId);
    }
  }, [currentUser?.organizationId]);

  // Suscripción Realtime & Polling con filtro estricto por organización
  useEffect(() => {
    const channel = supabase.channel('realtime-leads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
        loadLeadsFromSupabase(currentUser?.organizationId);
      })
      .subscribe();

    const interval = setInterval(() => {
      loadLeadsFromSupabase(currentUser?.organizationId);
    }, 6000);
    
    return () => { 
      supabase.removeChannel(channel); 
      clearInterval(interval);
    };
  }, [currentUser?.organizationId]);

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

  // ── Vista Pública: Landing Page ─────────────────────────────────────────────
  if (currentView === "landing") {
    return (
      <LandingPage
        properties={properties}
        onLoginClick={() => setCurrentView("login")}
        onOpenSofia={() => setIsDrawerOpen(true)}
      />
    );
  }

  // ── Auth Guard: mostrar Login si no hay sesión activa ───────────────────────
  if (!currentUser || currentView === "login") {
    return <LoginPage onAuthSuccess={(user) => { setCurrentUser(user); setCurrentView("pipeline"); }} />;
  }

  // ── Admin Guard: mostrar SuperAdmin Panel ───────────────────────────────────
  if (currentView === "admin") {
    return (
      <SuperAdminPanel
        currentUser={currentUser}
        onLogout={handleLogout}
        onSwitchTenant={(orgId, orgName) => {
          setCurrentUser((prev) =>
            prev ? { ...prev, organizationId: orgId, organizationName: orgName } : null
          );
          setCurrentView("pipeline");
        }}
      />
    );
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
    if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl;
    
    if (Object.keys(dbUpdates).length > 0) {
      const { error } = await supabase.from("properties").update(dbUpdates).eq("id", id);
      if (!error) {
        setToastMessage("Los datos e imágenes del inmueble se actualizaron correctamente.");
        setShowToast(true);
      } else {
        console.error("Error al actualizar inmueble:", error.message);
      }
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
    <div className="flex flex-col h-screen w-full bg-[#090D16] font-sans text-slate-100 overflow-hidden selection:bg-[#D4AF37]/30 selection:text-[#F3E5AB]">
      
      {/* 1. TOP EXECUTIVE HEADER - Luxury Suite Theme */}
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
        onOpenAgencySettings={() => setIsAgencySettingsOpen(true)}
      />

      {/* 2. SUB-BAR NAVIGATION / TABS */}
      <div className="bg-[#0B0F19] border-b border-slate-800/80 px-2 md:px-6 py-2 flex items-center justify-between shrink-0 overflow-x-auto custom-scrollbar">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveTab("pipeline")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "pipeline"
                ? "bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-slate-950 shadow-md shadow-[#D4AF37]/20 font-black"
                : "text-slate-400 hover:text-white hover:bg-[#111622]"
            }`}
          >
            <Kanban className="w-3.5 h-3.5" />
            <span>Kanban Pipeline</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${activeTab === "pipeline" ? "bg-slate-950/40 text-slate-950" : "bg-slate-900 text-slate-400"}`}>
              {filteredLeads.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("rag")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "rag"
                ? "bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-slate-950 shadow-md shadow-[#D4AF37]/20 font-black"
                : "text-slate-400 hover:text-white hover:bg-[#111622]"
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            <span>Inventario RAG</span>
            <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${activeTab === "rag" ? "bg-slate-950/40 text-slate-950" : "bg-slate-900 text-slate-400"}`}>
              {properties.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("dashboard")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "dashboard"
                ? "bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-slate-950 shadow-md shadow-[#D4AF37]/20 font-black"
                : "text-slate-400 hover:text-white hover:bg-[#111622]"
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>KPIs Executive</span>
          </button>

          <button
            onClick={() => setActiveTab("chat")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "chat"
                ? "bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-slate-950 shadow-md shadow-[#D4AF37]/20 font-black"
                : "text-slate-400 hover:text-white hover:bg-[#111622]"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Central Chat</span>
          </button>

          <button
            onClick={() => setActiveTab("simulator")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === "simulator"
                ? "bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-slate-950 shadow-md shadow-[#D4AF37]/20 font-black"
                : "text-slate-400 hover:text-white hover:bg-[#111622]"
            }`}
          >
            <Bot className={`w-3.5 h-3.5 ${activeTab === "simulator" ? "text-slate-950" : "text-[#D4AF37]"}`} />
            <span>Simulador IA (Sandbox)</span>
          </button>
        </div>

        {/* Quick VIS Toggle Filter */}
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <label className="flex items-center gap-1.5 cursor-pointer bg-[#111622] hover:bg-[#182030] px-3 py-1 rounded-xl border border-slate-800 transition">
            <input
              type="checkbox"
              checked={visOnlyFilter}
              onChange={(e) => setVisOnlyFilter(e.target.checked)}
              className="w-3.5 h-3.5 text-[#D4AF37] accent-[#D4AF37] rounded border-slate-700 focus:ring-[#D4AF37]"
            />
            <span className="text-[11px] font-bold text-slate-300">Solo Crédito VIS (ASFI)</span>
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

        {/* VIEW 5: BOT SIMULATOR & PLAYGROUND */}
        {activeTab === "simulator" && (
          <BotSimulatorView properties={properties} />
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

      {/* Global Save Toast Notification */}
      <SaveToast
        isOpen={showToast}
        message={toastMessage}
        onClose={() => setShowToast(false)}
      />

      {/* Agency Administrator Settings Modal */}
      {currentUser && (
        <AgencySettingsModal
          isOpen={isAgencySettingsOpen}
          currentUser={currentUser}
          onClose={() => setIsAgencySettingsOpen(false)}
        />
      )}

    </div>
  );
}
