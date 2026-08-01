import React, { useState } from "react";
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
  FileText
} from "lucide-react";

import { Lead, Property, PipelineStage } from "@/src/types/property";
import { ChatDrawer } from "@/src/components/chat/ChatDrawer";
import { RagInventoryView } from "@/src/components/rag/RagInventoryView";
import { NewLeadModal } from "@/src/components/modals/NewLeadModal";
import { AppointmentModal } from "@/src/components/modals/AppointmentModal";
import { PdfFichaModal } from "@/src/components/modals/PdfFichaModal";

// Initial seed properties with city tags
const initialProperties: Property[] = [
  {
    id: "prop-1",
    organizationId: "org-1",
    title: "Smart Tower 2D",
    city: "Santa Cruz",
    zone: "Equipetrol Norte",
    priceUsd: 82000,
    bedrooms: 2,
    bathrooms: 2,
    areaSqm: 68.5,
    acceptsSocialHousing: true,
    status: "AVAILABLE",
    rawDescription: "Departamento 2D en Equipetrol con parqueo y balcón. Compatible con Crédito VIS de ASFI.",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBuKB4mqRHJLPsmjKEDw7p-COrNUcCLXZ8YQHIuRSoTNKL6L8isGXuS5J1etOj8S8i4_mle2cmdyloQCeiRjQeJiI4riUo_hXMDskWX2qnT2UABpd2bK2QE8lsm_y3M-pmEYfYA_Q5UGTe_aGYM8Aedk_VTQHS7Wb0zCvgf3Gb2VKtOtL6QdQ7kDWBxLyXLQ5NNjlucBj-XKi9PMtMQRPjBZXsTmHiV2J0beg6LhsFbwcr_c3cFutJ0yA",
    vectorIndexed: true,
    vectorDimensions: 1536,
  },
  {
    id: "prop-2",
    organizationId: "org-1",
    title: "Residencia Jardines del Sur",
    city: "La Paz",
    zone: "Zona Sur",
    priceUsd: 145000,
    bedrooms: 3,
    bathrooms: 3,
    areaSqm: 180,
    acceptsSocialHousing: true,
    status: "AVAILABLE",
    rawDescription: "Residencia soleada en Achumani Zona Sur con garaje y solarium. Apta para crédito de vivienda social.",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCYJU0S00GPmbGAajxzcXQNHnjnc8ulDjxL4MBMnvkxwxWkj2C5to5EcoW-fwuaOn6rw5JGdFKpa-c48rQ4D2-dP3Advpg0C94wROZfKe77aF0CyQZivV6MwDlDE4KjSvnoJicHDGJWsBV1uPLvPdxcHe_jfZLzOfhtCQKlkE5Mq40tFlo5IOqvHG88Zfhetq6CYb9Hg0Rs5-Ar0hcPMEG3ok6N6-DKqegGfsQu66t57pabLFX_REcsfA",
    vectorIndexed: true,
    vectorDimensions: 1536,
  },
  {
    id: "prop-3",
    organizationId: "org-1",
    title: "Condominio Cala Cala 3D",
    city: "Cochabamba",
    zone: "Cala Cala",
    priceUsd: 95000,
    bedrooms: 3,
    bathrooms: 2,
    areaSqm: 110,
    acceptsSocialHousing: true,
    status: "AVAILABLE",
    rawDescription: "Amplio departamento en zona residencial Cala Cala Cochabamba. Crédito VIS BCP pre-aprobado.",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuAa43ZWx_LxVoUAtNpS2fx6P0r6gpr0hOzB-G0gu3MAys8ppClBP0dARjvpssksYEHZ3lootGG7m68roTeubhBjZxpgobrTH1kUuvuA33lzhuL3vDoDqUgPIIMbOHlMoAj8cfR5St7Do9DYvJIv4oyO_iIJLlpaNFpbPCNI8rnDkHOWYz_pj2DMmmJsUP7mzdf9-Eg8CkbYOqN8fVjsZ6o-xiNlMcFr9bYUk2U-ihmnwAg4Wp0tOQrLeg",
    vectorIndexed: true,
    vectorDimensions: 1536,
  },
  {
    id: "prop-4",
    organizationId: "org-1",
    title: "Casa Quinta Urubó G3",
    city: "Santa Cruz",
    zone: "Urubó",
    priceUsd: 120000,
    bedrooms: 3,
    bathrooms: 3,
    areaSqm: 210,
    acceptsSocialHousing: true,
    status: "AVAILABLE",
    rawDescription: "Hermosa casa estilo chalet en condominio cerrado en el Urubó. Financiamiento bancario disponible.",
    imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuCYJU0S00GPmbGAajxzcXQNHnjnc8ulDjxL4MBMnvkxwxWkj2C5to5EcoW-fwuaOn6rw5JGdFKpa-c48rQ4D2-dP3Advpg0C94wROZfKe77aF0CyQZivV6MwDlDE4KjSvnoJicHDGJWsBV1uPLvPdxcHe_jfZLzOfhtCQKlkE5Mq40tFlo5IOqvHG88Zfhetq6CYb9Hg0Rs5-Ar0hcPMEG3ok6N6-DKqegGfsQu66t57pabLFX_REcsfA",
    vectorIndexed: true,
    vectorDimensions: 1536,
  }
];

// Initial seed leads for Kanban
const initialLeads: Lead[] = [
  {
    id: "lead-1",
    organizationId: "org-1",
    fullName: "Juan Pérez",
    phoneNumber: "+591 71234567",
    pipelineStage: "NUEVO",
    budgetMaxUsd: 85000,
    paymentMethod: "CREDITO_VIS",
    hasDownPayment: true,
    downPaymentPercent: 15,
    downPaymentBank: "Banco BCP",
    preferredZone: "Equipetrol Norte",
    propertyInterestId: "prop-1",
    matchedProperty: initialProperties[0],
    aiSummary: "Intención de compra ALTA: Busca 2D con parqueo. Aporte propio 15% listo en Banco BCP.",
    aiPaused: false,
    intentScore: 95,
    createdAt: "Hace 12m",
  },
  {
    id: "lead-2",
    organizationId: "org-1",
    fullName: "María Delgado",
    phoneNumber: "+591 78912345",
    pipelineStage: "EN_CALIFICACION",
    budgetMaxUsd: 120000,
    paymentMethod: "CREDITO_VIS",
    hasDownPayment: true,
    downPaymentPercent: 15,
    downPaymentBank: "Banco Mercantil",
    preferredZone: "Urubó",
    propertyInterestId: "prop-4",
    matchedProperty: initialProperties[3],
    aiSummary: "Preguntó por Casa Quinta Urubó. Confirmó 15% de cuota inicial ($18,000 USD).",
    aiPaused: false,
    intentScore: 72,
    createdAt: "Hace 25m",
  },
  {
    id: "lead-3",
    organizationId: "org-1",
    fullName: "Roberto Gómez",
    phoneNumber: "+591 69011223",
    pipelineStage: "CALIFICADO_VISITA_PENDIENTE",
    budgetMaxUsd: 95000,
    paymentMethod: "CREDITO_VIS",
    hasDownPayment: true,
    downPaymentPercent: 20,
    downPaymentBank: "Banco Ganadero",
    preferredZone: "Cala Cala",
    propertyInterestId: "prop-3",
    matchedProperty: initialProperties[2],
    aiSummary: "Visita agendada para mañana a las 10:00 AM en Condominio Cala Cala.",
    aiPaused: false,
    intentScore: 89,
    createdAt: "Hace 2h",
  },
  {
    id: "lead-4",
    organizationId: "org-1",
    fullName: "Andrés Roca",
    phoneNumber: "+591 70099887",
    pipelineStage: "VISITA_REALIZADA",
    budgetMaxUsd: 145000,
    paymentMethod: "CREDITO_BANCARIO",
    hasDownPayment: true,
    downPaymentPercent: 20,
    downPaymentBank: "Banco Mercantil",
    preferredZone: "Zona Sur",
    propertyInterestId: "prop-2",
    matchedProperty: initialProperties[1],
    aiSummary: "Visita realizada en La Paz Achumani. Le gustó la orientación solar.",
    aiPaused: true,
    intentScore: 92,
    createdAt: "Ayer",
  },
  {
    id: "lead-5",
    organizationId: "org-1",
    fullName: "Fernando Camacho",
    phoneNumber: "+591 71055667",
    pipelineStage: "EN_NEGOCIACION",
    budgetMaxUsd: 220000,
    paymentMethod: "CONTADO",
    hasDownPayment: true,
    downPaymentPercent: 100,
    preferredZone: "Equipetrol",
    aiSummary: "Oferta presentada al propietario: $215,000 USD al contado.",
    aiPaused: true,
    intentScore: 96,
    createdAt: "Hace 3 días",
  },
  {
    id: "lead-6",
    organizationId: "org-1",
    fullName: "Monica Vaca",
    phoneNumber: "+591 72088990",
    pipelineStage: "CERRADO",
    budgetMaxUsd: 185000,
    paymentMethod: "CREDITO_BANCARIO",
    hasDownPayment: true,
    downPaymentPercent: 30,
    preferredZone: "Zona Sur",
    aiSummary: "Cierre exitoso. Minuta de compraventa firmada en notaría.",
    aiPaused: true,
    intentScore: 100,
    createdAt: "Hace 1 semana",
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<"pipeline" | "rag" | "dashboard" | "chat" | "settings">("pipeline");
  const [leads, setLeads] = useState<Lead[]>(initialLeads);
  const [properties, setProperties] = useState<Property[]>(initialProperties);
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

  // Handlers
  const handleOpenChat = (lead: Lead) => {
    setSelectedLead(lead);
    setIsDrawerOpen(true);
  };

  const handleToggleAiPause = (leadId: string, isPaused: boolean) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, aiPaused: isPaused } : l))
    );
    if (selectedLead && selectedLead.id === leadId) {
      setSelectedLead((prev) => (prev ? { ...prev, aiPaused: isPaused } : null));
    }
  };

  const handleAddLead = (newLead: Lead) => {
    setLeads((prev) => [newLead, ...prev]);
  };

  const handleAddProperty = (newProp: Partial<Property>) => {
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
      imageUrl: newProp.imageUrl || "https://lh3.googleusercontent.com/aida-public/AB6AXuBuKB4mqRHJLPsmjKEDw7p-COrNUcCLXZ8YQHIuRSoTNKL6L8isGXuS5J1etOj8S8i4_mle2cmdyloQCeiRjQeJiI4riUo_hXMDskWX2qnT2UABpd2bK2QE8lsm_y3M-pmEYfYA_Q5UGTe_aGYM8Aedk_VTQHS7Wb0zCvgf3Gb2VKtOtL6QdQ7kDWBxLyXLQ5NNjlucBj-XKi9PMtMQRPjBZXsTmHiV2J0beg6LhsFbwcr_c3cFutJ0yA",
      vectorIndexed: true,
      vectorDimensions: 1536,
    };
    setProperties((prev) => [created, ...prev]);
  };

  const handleMoveStage = (leadId: string, newStage: PipelineStage) => {
    setLeads((prev) =>
      prev.map((l) => (l.id === leadId ? { ...l, pipelineStage: newStage } : l))
    );
  };

  const handleConfirmAppointment = (leadId: string, details: { date: string; time: string; agent: string; notes: string }) => {
    setLeads((prev) =>
      prev.map((l) =>
        l.id === leadId
          ? {
              ...l,
              pipelineStage: "CALIFICADO_VISITA_PENDIENTE",
              aiSummary: `Visita agendada para el ${details.date} a las ${details.time} con ${details.agent}.`,
            }
          : l
      )
    );
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

  const kanbanColumns: { stage: PipelineStage; label: string; countBadge: string }[] = [
    { stage: "NUEVO", label: "NUEVO", countBadge: "bg-slate-200 text-slate-800" },
    { stage: "EN_CALIFICACION", label: "EN CALIFICACIÓN", countBadge: "bg-slate-200 text-slate-800" },
    { stage: "CALIFICADO_VISITA_PENDIENTE", label: "CALIFICADO", countBadge: "bg-emerald-100 text-emerald-800" },
    { stage: "VISITA_REALIZADA", label: "VISITA", countBadge: "bg-slate-200 text-slate-800" },
    { stage: "EN_NEGOCIACION", label: "NEGOCIACIÓN", countBadge: "bg-slate-200 text-slate-800" },
    { stage: "CERRADO", label: "CERRADO", countBadge: "bg-emerald-500 text-white" },
  ];

  return (
    <div className="flex flex-col h-screen w-full bg-[#F8FAFC] font-sans text-slate-900 overflow-hidden">
      
      {/* 1. TOP EXECUTIVE HEADER - "Professional Polish" Theme */}
      <header className="h-16 bg-[#0F172A] border-b border-slate-800 flex items-center justify-between px-6 shrink-0 z-30">
        
        {/* Brand & Connection Status */}
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-white text-xl shadow-md">
            P
          </div>
          <h1 className="text-white font-bold text-lg tracking-tight flex items-center gap-1.5">
            PROPERTY <span className="text-slate-400 font-medium text-sm">OS</span>
          </h1>

          <div className="ml-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10B981]" />
            <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">
              Evolution API: Conectado
            </span>
          </div>
        </div>

        {/* Global Controls: Search, City Filter & Actions */}
        <div className="flex items-center gap-3">
          
          {/* City Dropdown Filter */}
          <div className="relative">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-slate-800 text-xs font-bold text-slate-200 rounded-lg py-2 pl-3 pr-8 border border-slate-700 outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer appearance-none"
            >
              <option value="TODAS">📍 Todas las Ciudades</option>
              <option value="Santa Cruz">📍 Santa Cruz</option>
              <option value="La Paz">📍 La Paz</option>
              <option value="Cochabamba">📍 Cochabamba</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
          </div>

          {/* Search Box */}
          <div className="relative hidden sm:block">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar leads, zona o teléfono..."
              className="bg-slate-800 border border-slate-700 rounded-lg py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-400 w-56 outline-none focus:ring-1 focus:ring-emerald-500 focus:w-64 transition-all"
            />
          </div>

          {/* New Lead Action Button */}
          <button
            onClick={() => setIsNewLeadModalOpen(true)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-2 rounded-lg text-xs font-bold transition-all"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span className="hidden md:inline">+ Lead</span>
          </button>

          {/* Ingesta RAG Primary Action Button */}
          <button
            onClick={() => setActiveTab("rag")}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors shadow-lg shadow-emerald-900/20"
          >
            <Plus className="w-4 h-4" />
            <span>+ Ingesta RAG</span>
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors relative"
            >
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-emerald-500 absolute top-1.5 right-1.5" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-2xl border border-slate-200 p-3 text-xs z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 font-bold text-slate-900">
                  <span>Notificaciones en Vivo</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">Evolution API</span>
                </div>
                <div className="space-y-2 pt-2">
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="font-bold text-slate-800">Juan Pérez calificado</p>
                    <p className="text-slate-500 text-[10px]">Cuota inicial 15% confirmada en BCP.</p>
                  </div>
                  <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                    <p className="font-bold text-slate-800">Ingesta RAG ejecutada</p>
                    <p className="text-slate-500 text-[10px]">Vector de 1536d creado para Smart Tower.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

        </div>

      </header>

      {/* 2. SUB-BAR NAVIGATION / TABS */}
      <div className="bg-[#0F172A] border-b border-slate-800 px-6 py-2 flex items-center justify-between shrink-0">
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
          <div className="flex-1 flex flex-col min-w-0 bg-[#F1F5F9] h-full overflow-hidden">
            <div className="p-4 flex gap-4 overflow-x-auto h-full custom-scrollbar">
              {kanbanColumns.map((col) => {
                const stageLeads = filteredLeads.filter((l) => l.pipelineStage === col.stage);

                return (
                  <div key={col.stage} className="flex-1 flex flex-col min-w-[200px] max-w-[280px]">
                    
                    {/* Column Header */}
                    <h3 className="text-xs font-bold text-slate-500 mb-3 flex items-center justify-between uppercase tracking-widest shrink-0">
                      <span>{col.label}</span>
                      <span className={`${col.countBadge} px-2 py-0.5 rounded text-[10px] font-mono font-bold`}>
                        {stageLeads.length}
                      </span>
                    </h3>

                    {/* Card List Container */}
                    <div className="flex-1 overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                      {stageLeads.map((lead) => (
                        <div
                          key={lead.id}
                          className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all relative group"
                        >
                          {/* Card Header */}
                          <div className="flex justify-between items-start mb-2">
                            <span 
                              onClick={() => handleOpenChat(lead)}
                              className="text-xs font-bold text-slate-900 cursor-pointer hover:text-emerald-600 transition-colors"
                            >
                              {lead.fullName}
                            </span>
                            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 flex items-center gap-0.5">
                              {lead.intentScore} 🔥
                            </span>
                          </div>

                          {/* Details */}
                          <div className="text-[10px] text-slate-500 mb-2 font-medium">
                            {lead.matchedProperty ? `Preguntó por: ${lead.matchedProperty.title}` : `Zona: ${lead.preferredZone}`}
                          </div>

                          {/* Badges */}
                          <div className="flex flex-wrap gap-1 mb-3">
                            <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-slate-600 font-bold">
                              ${lead.budgetMaxUsd.toLocaleString()} USD
                            </span>
                            
                            {lead.paymentMethod === "CREDITO_VIS" && (
                              <span className="text-[9px] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 text-blue-700 font-bold italic">
                                Crédito VIS
                              </span>
                            )}

                            {lead.hasDownPayment && (
                              <span className="text-[9px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-100 text-emerald-700 font-bold">
                                Aporte: {lead.downPaymentPercent}%
                              </span>
                            )}
                          </div>

                          {/* Quick Stage Change Selector */}
                          <div className="mb-2.5">
                            <select
                              value={lead.pipelineStage}
                              onChange={(e) => handleMoveStage(lead.id, e.target.value as PipelineStage)}
                              className="w-full text-[10px] font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded py-1 px-1.5 outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                            >
                              <option value="NUEVO">Etapa: NUEVO</option>
                              <option value="EN_CALIFICACION">Etapa: EN CALIFICACIÓN</option>
                              <option value="CALIFICADO_VISITA_PENDIENTE">Etapa: CALIFICADO</option>
                              <option value="VISITA_REALIZADA">Etapa: VISITA</option>
                              <option value="EN_NEGOCIACION">Etapa: NEGOCIACIÓN</option>
                              <option value="CERRADO">Etapa: CERRADO</option>
                            </select>
                          </div>

                          {/* Action Buttons */}
                          <div className="grid grid-cols-2 gap-1.5 pt-1 border-t border-slate-100">
                            <button
                              onClick={() => handleOpenChat(lead)}
                              className="w-full py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded text-[10px] font-bold transition-colors text-center"
                            >
                              💬 Chat
                            </button>
                            <button
                              onClick={() => {
                                setLeadForAppointment(lead);
                                setIsAppointmentModalOpen(true);
                              }}
                              className="w-full py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded text-[10px] font-bold transition-colors text-center shadow-xs"
                            >
                              📅 Visita
                            </button>
                          </div>

                        </div>
                      ))}

                      {stageLeads.length === 0 && (
                        <div className="p-4 text-center text-[11px] text-slate-400 border border-dashed border-slate-300 rounded-xl">
                          Sin tarjetas
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* VIEW 2: RAG INVENTORY */}
        {activeTab === "rag" && (
          <RagInventoryView
            properties={properties}
            onAddProperty={handleAddProperty}
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
                  {leads.filter(l => l.pipelineStage === 'CALIFICADO_VISITA_PENDIENTE' || l.pipelineStage === 'VISITA_REALIZADA').length}
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
                    <span className="font-bold text-slate-900">${lead.budgetMaxUsd.toLocaleString()} USD</span>
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
