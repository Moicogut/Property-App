import React from "react";
import {
  MoreHorizontal,
  Search,
  Plus,
  Bell,
  XCircle,
  Shield,
  LogOut,
  ChevronDown,
  Building2,
  Globe,
} from "lucide-react";
import { AppUser } from "@/src/types/property";
import { PropertyLogo } from "@/src/components/brand/PropertyLogo";

interface AppHeaderProps {
  currentUser: AppUser;
  onLogout: () => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCity: string;
  setSelectedCity: (city: string) => void;
  setIsNewLeadModalOpen: (open: boolean) => void;
  setActiveTab: (tab: "pipeline" | "rag" | "dashboard" | "chat" | "simulator") => void;
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  setCurrentView: (view: "landing" | "pipeline" | "admin") => void;
  onOpenAgencySettings?: () => void;
}

export function AppHeader({
  currentUser,
  onLogout,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  searchQuery,
  setSearchQuery,
  selectedCity,
  setSelectedCity,
  setIsNewLeadModalOpen,
  setActiveTab,
  showNotifications,
  setShowNotifications,
  setCurrentView,
  onOpenAgencySettings,
}: AppHeaderProps) {
  return (
    <>
      <header className="h-16 bg-[#0B0D12] border-b border-slate-800/80 flex items-center justify-between px-3 md:px-6 shrink-0 z-30 font-sans">
        {/* Brand & Connection Status */}
        <div className="flex items-center gap-3">
          {/* Menú Hamburguesa Móvil */}
          <button
            className="md:hidden text-slate-300 hover:text-[#D4AF37] p-1"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <XCircle className="w-6 h-6" /> : <MoreHorizontal className="w-6 h-6" />}
          </button>

          {/* Clickable Logo to Landing */}
          <div 
            onClick={() => setCurrentView("landing")} 
            className="cursor-pointer hover:opacity-85 transition-opacity"
            title="Ir al Portal Inmobiliario Público"
          >
            <PropertyLogo variant="horizontal" size="sm" className="hidden sm:flex" />
          </div>

          <div className="ml-0 md:ml-2 px-2.5 md:px-3 py-1 bg-[#D4AF37]/10 border border-[#D4AF37]/25 rounded-full flex items-center gap-1.5 md:gap-2">
            <div className="w-2 h-2 rounded-full bg-[#D4AF37] animate-pulse shadow-[0_0_8px_#D4AF37]" />
            <span className="text-[10px] md:text-xs font-bold text-[#F3E5AB] uppercase tracking-wider whitespace-nowrap">
              Evo API
            </span>
          </div>
        </div>

        {/* Global Controls: Search, City Filter & Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* Direct Portal Web / Landing Shortcut */}
          <button
            onClick={() => setCurrentView("landing")}
            className="flex items-center gap-1.5 bg-[#111622] hover:bg-[#1A2234] text-slate-200 hover:text-[#F3E5AB] border border-slate-800 hover:border-[#D4AF37]/50 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
            title="Ver Portal Inmobiliario / Catálogo Público"
          >
            <Globe className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span className="hidden md:inline">Portal Web</span>
          </button>

          {/* City Dropdown Filter (Hidden on Mobile) */}
          <div className="relative hidden lg:block">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-[#111622] text-xs font-bold text-slate-200 rounded-xl py-2 pl-3 pr-8 border border-slate-800 outline-none focus:ring-1 focus:ring-[#D4AF37] cursor-pointer appearance-none"
            >
              <option value="TODAS">📍 Todas</option>
              <option value="Santa Cruz">📍 Santa Cruz</option>
              <option value="La Paz">📍 La Paz</option>
              <option value="Cochabamba">📍 CBB</option>
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
              className="bg-[#111622] border border-slate-800 rounded-xl py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-500 w-56 outline-none focus:ring-1 focus:ring-[#D4AF37] focus:w-64 transition-all font-medium"
            />
          </div>

          {/* New Lead Action Button */}
          <button
            onClick={() => setIsNewLeadModalOpen(true)}
            className="flex items-center gap-1.5 bg-[#111622] hover:bg-[#1A2234] text-slate-200 border border-slate-800 hover:border-[#D4AF37]/40 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#D4AF37]" />
            <span className="hidden md:inline">+ Lead</span>
          </button>

          {/* Ingesta RAG Primary Action Button (Hidden on Mobile) */}
          <button
            onClick={() => setActiveTab("rag")}
            className="hidden md:flex items-center gap-1.5 bg-gradient-to-r from-[#D4AF37] to-[#AA8010] hover:brightness-110 text-slate-950 px-4 py-2 rounded-xl text-xs font-black transition-all shadow-lg shadow-[#D4AF37]/20 tracking-wide cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>+ Ingesta RAG</span>
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 text-slate-400 hover:text-[#D4AF37] rounded-xl hover:bg-[#111622] transition-colors relative cursor-pointer"
            >
              <Bell className="w-4 h-4" />
              <span className="w-2 h-2 rounded-full bg-[#D4AF37] absolute top-1.5 right-1.5" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-72 bg-[#111622] rounded-2xl shadow-2xl border border-slate-800 p-3 text-xs z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex justify-between items-center pb-2 border-b border-slate-800 font-bold text-white">
                  <span>Notificaciones en Vivo</span>
                  <span className="text-[10px] bg-[#D4AF37]/10 text-[#F3E5AB] border border-[#D4AF37]/25 px-2 py-0.5 rounded-full font-bold">
                    Evolution API
                  </span>
                </div>
                <div className="space-y-2 pt-2">
                  <div className="p-2.5 bg-[#090D16] rounded-xl border border-slate-800">
                    <p className="font-bold text-slate-200">Juan Pérez calificado</p>
                    <p className="text-slate-400 text-[10px] mt-0.5">Cuota inicial 15% confirmada en BCP.</p>
                  </div>
                  <div className="p-2.5 bg-[#090D16] rounded-xl border border-slate-800">
                    <p className="font-bold text-slate-200">Ingesta RAG ejecutada</p>
                    <p className="text-slate-400 text-[10px] mt-0.5">Vector de 1536d creado para Smart Tower.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Agency Admin Access (Mi Inmobiliaria) */}
          {(currentUser.role === "agency_admin" || currentUser.role === "superadmin") && (
            <button
              onClick={() => onOpenAgencySettings && onOpenAgencySettings()}
              className="flex items-center gap-1.5 bg-[#111622] hover:bg-[#1A2234] text-[#F3E5AB] border border-[#D4AF37]/30 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Administrar Mi Inmobiliaria"
            >
              <Building2 className="w-3.5 h-3.5 text-[#D4AF37]" />
              <span className="hidden md:inline">Mi Inmobiliaria</span>
            </button>
          )}

          {/* SuperAdmin Access */}
          {currentUser.role === "superadmin" && (
            <button
              onClick={() => setCurrentView("admin")}
              className="flex items-center gap-1.5 bg-purple-950/60 hover:bg-purple-900/50 text-purple-300 border border-purple-700/40 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
              title="Panel SuperAdmin"
            >
              <Shield className="w-3.5 h-3.5 text-purple-400" />
              <span className="hidden md:inline">SuperAdmin</span>
            </button>
          )}

          {/* User & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
            <div className="hidden md:block text-right">
              <p className="text-[11px] font-bold text-white leading-none">{currentUser.fullName}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {currentUser.organizationName || (currentUser.role === 'superadmin' ? 'SuperAdmin Global' : 'Asesor Inmobiliario')}
              </p>
            </div>
            <button
              onClick={onLogout}
              title="Cerrar Sesión"
              className="p-1.5 md:p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-rose-950/20 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE MENU DRAWER */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 flex flex-col gap-4 animate-in slide-in-from-top z-20 shadow-xl">
          <button
            onClick={() => {
              setCurrentView("landing");
              setIsMobileMenuOpen(false);
            }}
            className="flex items-center justify-center gap-2 bg-[#111622] text-[#F3E5AB] border border-[#D4AF37]/30 py-2.5 rounded-xl text-xs font-bold"
          >
            <Globe className="w-4 h-4 text-[#D4AF37]" />
            <span>🌐 Ver Portal Inmobiliario Público</span>
          </button>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar leads, zona o teléfono..."
              className="bg-slate-800 border border-slate-700 rounded-lg py-2 pl-9 pr-4 text-xs text-slate-200 placeholder-slate-400 w-full outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="w-full bg-slate-800 text-xs font-bold text-slate-200 rounded-lg py-2 px-3 border border-slate-700 outline-none"
          >
            <option value="TODAS">📍 Todas las Ciudades</option>
            <option value="Santa Cruz">📍 Santa Cruz</option>
            <option value="La Paz">📍 La Paz</option>
            <option value="Cochabamba">📍 Cochabamba</option>
          </select>

          <button
            onClick={() => {
              setActiveTab("rag");
              setIsMobileMenuOpen(false);
            }}
            className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-lg text-xs font-semibold shadow-lg shadow-emerald-900/20 w-full"
          >
            <Plus className="w-4 h-4" />
            <span>+ Agregar al Inventario RAG</span>
          </button>
        </div>
      )}
    </>
  );
}
