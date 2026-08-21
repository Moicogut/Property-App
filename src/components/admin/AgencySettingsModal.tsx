import React, { useState, useEffect } from "react";
import { 
  X, 
  Building2, 
  Users, 
  Bot, 
  Save, 
  ShieldCheck, 
  Sparkles, 
  CheckCircle2, 
  UserPlus, 
  Trash2, 
  Mail, 
  Phone,
  MessageSquare
} from "lucide-react";
import { AppUser } from "@/src/types/property";
import { supabase } from "@/src/lib/supabase";

interface AgencySettingsModalProps {
  isOpen: boolean;
  currentUser: AppUser;
  onClose: () => void;
}

interface TeamMember {
  id: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
}

export const AgencySettingsModal: React.FC<AgencySettingsModalProps> = ({
  isOpen,
  currentUser,
  onClose,
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<"agency" | "team" | "sofia">("agency");
  const [agencyName, setAgencyName] = useState(currentUser.organizationName || "Mi Inmobiliaria");
  const [primaryCity, setPrimaryCity] = useState("Santa Cruz");
  const [whatsappInstance, setWhatsappInstance] = useState("PropertyOS-Main");
  const [sofiaTone, setSofiaTone] = useState("PROFESSIONAL_WARM");
  const [sofiaCustomRules, setSofiaCustomRules] = useState("");
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  
  // New agent form
  const [newAgentEmail, setNewAgentEmail] = useState("");
  const [newAgentName, setNewAgentName] = useState("");
  const [isAddingAgent, setIsAddingAgent] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadAgencyData();
    loadTeamMembers();
  }, [currentUser.organizationId]);

  const loadAgencyData = async () => {
    if (!currentUser.organizationId) return;
    try {
      const { data } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", currentUser.organizationId)
        .maybeSingle();

      if (data) {
        setAgencyName(data.name || "Mi Inmobiliaria");
        setPrimaryCity(data.primary_city || "Santa Cruz");
        setWhatsappInstance(data.whatsapp_instance_id || "PropertyOS-Main");
        if (data.ai_config) {
          setSofiaTone(data.ai_config.tone || "PROFESSIONAL_WARM");
          setSofiaCustomRules(data.ai_config.systemRules || "");
        }
      }
    } catch (e) {
      console.warn("[AgencySettings] Error cargando datos:", e);
    }
  };

  const loadTeamMembers = async () => {
    if (!currentUser.organizationId) return;
    try {
      const { data } = await supabase
        .from("users")
        .select("id, email, full_name, role, created_at")
        .eq("organization_id", currentUser.organizationId)
        .order("created_at", { ascending: false });

      if (data) {
        setTeamMembers(
          data.map((u) => ({
            id: u.id,
            email: u.email,
            fullName: u.full_name,
            role: u.role,
            createdAt: new Date(u.created_at || Date.now()).toLocaleDateString(),
          }))
        );
      }
    } catch (e) {
      console.warn("[AgencySettings] Error cargando equipo:", e);
    }
  };

  const handleSaveAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage(null);

    try {
      if (currentUser.organizationId) {
        await supabase
          .from("organizations")
          .update({
            name: agencyName,
            whatsapp_instance_id: whatsappInstance,
            ai_config: {
              primary_city: primaryCity,
              tone: sofiaTone,
              systemRules: sofiaCustomRules,
            },
          })
          .eq("id", currentUser.organizationId);

        setMessage("✅ Configuración de la agencia guardada exitosamente.");
        setTimeout(() => setMessage(null), 2500);
      }
    } catch (err) {
      setMessage("❌ Error al guardar.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentEmail.trim() || !newAgentName.trim()) return;

    setIsAddingAgent(true);
    setMessage(null);

    try {
      const { data, error } = await supabase
        .from("users")
        .upsert(
          {
            email: newAgentEmail.trim().toLowerCase(),
            full_name: newAgentName.trim(),
            role: "agent",
            organization_id: currentUser.organizationId || null,
            user_type: "INDEPENDENT_AGENT",
          },
          { onConflict: "email" }
        )
        .select()
        .single();

      if (error) {
        setMessage(`❌ Error: ${error.message}`);
      } else {
        setNewAgentEmail("");
        setNewAgentName("");
        setMessage("✅ Asesor añadido al equipo exitosamente.");
        loadTeamMembers();
        setTimeout(() => setMessage(null), 2500);
      }
    } catch (err) {
      setMessage("❌ Error al añadir asesor.");
    } finally {
      setIsAddingAgent(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-auto animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Panel de Administración de Inmobiliaria</h3>
              <p className="text-xs text-slate-500">Gestión de equipo, branding y parámetros de Sofía IA</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 border-b border-slate-100 pb-2 text-xs font-bold">
          <button
            onClick={() => setActiveTab("agency")}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === "agency"
                ? "bg-slate-900 text-white"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Perfil Agencia</span>
          </button>
          <button
            onClick={() => setActiveTab("team")}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === "team"
                ? "bg-slate-900 text-white"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Equipo de Asesores ({teamMembers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("sofia")}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === "sofia"
                ? "bg-slate-900 text-white"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100"
            }`}
          >
            <Bot className="w-3.5 h-3.5 text-emerald-500" />
            <span>Personalización Sofía IA</span>
          </button>
        </div>

        {message && (
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 text-center">
            {message}
          </div>
        )}

        {/* Tab 1: Perfil Agencia */}
        {activeTab === "agency" && (
          <form onSubmit={handleSaveAgency} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nombre Comercial de la Inmobiliaria</label>
              <input
                type="text"
                required
                value={agencyName}
                onChange={(e) => setAgencyName(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 font-bold text-slate-900"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ciudad Principal</label>
                <select
                  value={primaryCity}
                  onChange={(e) => setPrimaryCity(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                >
                  <option value="Santa Cruz">Santa Cruz de la Sierra</option>
                  <option value="La Paz">La Paz</option>
                  <option value="Cochabamba">Cochabamba</option>
                  <option value="Tarija">Tarija</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Instancia WhatsApp (Evolution API)</label>
                <input
                  type="text"
                  value={whatsappInstance}
                  onChange={(e) => setWhatsappInstance(e.target.value)}
                  placeholder="ej. PropertyOS-Main"
                  className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md disabled:opacity-50"
              >
                <Save className="w-4 h-4 text-emerald-400" />
                <span>{isSaving ? "Guardando..." : "Guardar Cambios"}</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Equipo de Asesores */}
        {activeTab === "team" && (
          <div className="space-y-4 text-xs">
            {/* Formulario Añadir Asesor */}
            <form onSubmit={handleAddAgent} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-800 block">Invitar Nuevo Asesor al Panel</span>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Nombre y Apellido"
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  className="border border-slate-200 rounded-lg p-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
                <input
                  type="email"
                  required
                  placeholder="correo@inmobiliaria.com"
                  value={newAgentEmail}
                  onChange={(e) => setNewAgentEmail(e.target.value)}
                  className="border border-slate-200 rounded-lg p-2 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>
              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isAddingAgent}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg flex items-center gap-1 shadow-xs disabled:opacity-50"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isAddingAgent ? "Añadiendo..." : "Añadir Asesor"}</span>
                </button>
              </div>
            </form>

            {/* Listado de Miembros */}
            <div className="divide-y divide-slate-100 max-h-56 overflow-y-auto">
              {teamMembers.map((member) => (
                <div key={member.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">{member.fullName}</div>
                    <div className="text-[11px] text-slate-400">{member.email} · Registrado {member.createdAt}</div>
                  </div>
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                    member.role === 'agency_admin' ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {member.role === 'agency_admin' ? 'Director' : 'Asesor Inmobiliario'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Personalización Sofía IA */}
        {activeTab === "sofia" && (
          <form onSubmit={handleSaveAgency} className="space-y-3.5 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tono y Personalidad de Sofía IA</label>
              <select
                value={sofiaTone}
                onChange={(e) => setSofiaTone(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 font-bold"
              >
                <option value="PROFESSIONAL_WARM">🌟 Profesional, Cálido & Consultivo (Recomendado)</option>
                <option value="EXECUTIVE_CONCISE">👔 Ejecutivo & Conciso (Alta Gama / Inversionistas)</option>
                <option value="ENTHUSIASTIC_CLOSER">🔥 Entusiasta, Dinámico y Proactivo al Cierre</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Reglas Especiales de la Agencia para Sofía</label>
              <textarea
                rows={4}
                value={sofiaCustomRules}
                onChange={(e) => setSofiaCustomRules(e.target.value)}
                placeholder="ej. Indicar que la oficina central está en Equipetrol Calle 8; recordar a los clientes que los precios son negociables..."
                className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-xs"
              />
              <p className="text-[10px] text-slate-400 mt-1">Estas instrucciones se inyectan automáticamente en el System Prompt de Sofía para esta agencia.</p>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-md disabled:opacity-50"
              >
                <Save className="w-4 h-4 text-emerald-400" />
                <span>{isSaving ? "Guardando..." : "Guardar Personalización IA"}</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
