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
} from "lucide-react";
import { AppUser } from "@/src/types/property";

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
  setActiveTab: (tab: "pipeline" | "rag" | "dashboard" | "chat") => void;
  showNotifications: boolean;
  setShowNotifications: (show: boolean) => void;
  setCurrentView: (view: "pipeline" | "admin") => void;
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
}: AppHeaderProps) {
  return (
    <>
      <header className="h-16 bg-[#0F172A] border-b border-slate-800 flex items-center justify-between px-3 md:px-6 shrink-0 z-30">
        {/* Brand & Connection Status */}
        <div className="flex items-center gap-3">
          {/* Menú Hamburguesa Móvil */}
          <button
            className="md:hidden text-slate-300 hover:text-white p-1"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <XCircle className="w-6 h-6" /> : <MoreHorizontal className="w-6 h-6" />}
          </button>

          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-white text-xl shadow-md hidden sm:flex">
            P
          </div>
          <h1 className="text-white font-bold text-base md:text-lg tracking-tight flex items-center gap-1.5">
            PROPERTY <span className="text-slate-400 font-medium text-sm">OS</span>
          </h1>

          <div className="ml-0 md:ml-2 px-2 md:px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center gap-1.5 md:gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10B981]" />
            <span className="text-[10px] md:text-xs font-semibold text-emerald-400 uppercase tracking-wider whitespace-nowrap">
              Evo API
            </span>
          </div>
        </div>

        {/* Global Controls: Search, City Filter & Actions */}
        <div className="flex items-center gap-2 md:gap-3">
          {/* City Dropdown Filter (Hidden on Mobile) */}
          <div className="relative hidden lg:block">
            <select
              value={selectedCity}
              onChange={(e) => setSelectedCity(e.target.value)}
              className="bg-slate-800 text-xs font-bold text-slate-200 rounded-lg py-2 pl-3 pr-8 border border-slate-700 outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer appearance-none"
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

          {/* Ingesta RAG Primary Action Button (Hidden on Mobile) */}
          <button
            onClick={() => setActiveTab("rag")}
            className="hidden md:flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-xs font-semibold transition-colors shadow-lg shadow-emerald-900/20"
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
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded">
                    Evolution API
                  </span>
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

          {/* SuperAdmin Access */}
          {currentUser.role === "superadmin" && (
            <button
              onClick={() => setCurrentView("admin")}
              className="flex items-center gap-1.5 bg-purple-900/30 hover:bg-purple-900/50 text-purple-300 border border-purple-700/40 px-3 py-2 rounded-lg text-xs font-bold transition-all"
              title="Panel SuperAdmin"
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden md:inline">SuperAdmin</span>
            </button>
          )}

          {/* User & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-700">
            <div className="hidden md:block text-right">
              <p className="text-[11px] font-bold text-white leading-none">{currentUser.fullName}</p>
              <p className="text-[10px] text-slate-500">{currentUser.role}</p>
            </div>
            <button
              onClick={onLogout}
              title="Cerrar Sesión"
              className="p-1.5 md:p-2 text-slate-400 hover:text-red-400 rounded-lg hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* MOBILE MENU DRAWER */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 p-4 flex flex-col gap-4 animate-in slide-in-from-top z-20 shadow-xl">
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
