import React, { useState } from "react";
import { Building2, Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { signIn, signUp } from "@/src/lib/auth";
import type { AppUser } from "@/src/types/property";
import { PropertyLogo } from "@/src/components/brand/PropertyLogo";

interface LoginPageProps {
  onAuthSuccess: (user: AppUser) => void;
  onBackToLanding?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onAuthSuccess, onBackToLanding }) => {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsLoading(true);

    try {
      if (mode === "register") {
        if (!fullName.trim()) {
          setError("Por favor ingresa tu nombre completo.");
          return;
        }
        const { user, error: authError } = await signUp(email, password, fullName);
        if (authError) {
          setError(authError);
          return;
        }
        if (user) {
          onAuthSuccess(user);
        } else {
          setSuccessMsg("Registro exitoso. Revisa tu email para confirmar tu cuenta.");
        }
      } else {
        const { user, error: authError } = await signIn(email, password);
        if (authError) {
          setError(authError);
          return;
        }
        if (user) onAuthSuccess(user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0D12] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      
      {/* Animated luxury background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#D4AF37]/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-[#F59E0B]/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        
        {/* Brand Header & Landing Shortcut */}
        <div className="text-center mb-6">
          {onBackToLanding && (
            <button
              onClick={onBackToLanding}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 mb-5 rounded-full bg-[#111622] border border-slate-800 text-xs font-bold text-slate-400 hover:text-[#F3E5AB] hover:border-[#D4AF37]/40 transition-all cursor-pointer"
            >
              <span>← Volver al Portal Inmobiliario</span>
            </button>
          )}
          <PropertyLogo variant="vertical" size="xl" showTagline className="mx-auto" />
        </div>

        {/* Card */}
        <div className="bg-[#111622]/90 border border-[#D4AF37]/25 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
          
          {/* Mode Switcher */}
          <div className="flex bg-[#0A0E17] rounded-xl p-1 mb-6 border border-slate-800">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); setSuccessMsg(null); }}
                className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                  mode === m
                    ? "bg-gradient-to-r from-[#D4AF37] to-[#E5C158] text-slate-950 shadow-md shadow-[#D4AF37]/20 font-black"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {m === "login" ? "Iniciar Sesión" : "Crear Cuenta"}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Full Name (register only) */}
            {mode === "register" && (
              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tu nombre y apellido"
                  className="w-full bg-[#0A0E17] border border-slate-800 focus:border-[#D4AF37] rounded-xl px-4 py-3 text-sm text-white placeholder-slate-600 outline-none focus:ring-1 focus:ring-[#D4AF37] transition-all"
                  required
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Email Corporativo
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@inmobiliaria.com"
                  className="w-full bg-[#0A0E17] border border-slate-800 focus:border-[#D4AF37] rounded-xl px-4 py-3 pl-10 text-sm text-white placeholder-slate-600 outline-none focus:ring-1 focus:ring-[#D4AF37] transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#0A0E17] border border-slate-800 focus:border-[#D4AF37] rounded-xl px-4 py-3 pl-10 pr-11 text-sm text-white placeholder-slate-600 outline-none focus:ring-1 focus:ring-[#D4AF37] transition-all"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error / Success Messages */}
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-medium px-4 py-3 rounded-xl">
                ⚠️ {error}
              </div>
            )}
            {successMsg && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-medium px-4 py-3 rounded-xl">
                ✅ {successMsg}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#D4AF37] hover:brightness-110 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-black py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-[#D4AF37]/20 flex items-center justify-center gap-2 tracking-wide"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 text-slate-950" />
              )}
              {isLoading
                ? "Verificando Credenciales..."
                : mode === "login"
                ? "Acceder a Property OS"
                : "Crear Cuenta de Asesor"}
            </button>
          </form>

          {/* Footer Info */}
          <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-[#D4AF37]" />
            <span>Autenticación segura y encriptada vía Supabase Auth</span>
          </div>
        </div>

        {/* Bottom branding */}
        <div className="text-center mt-6 flex items-center justify-center gap-3 text-[11px] text-slate-500 font-medium">
          <span className="flex items-center gap-1">
            <Building2 className="w-3 h-3 text-[#D4AF37]" /> Eje Troncal Bolivia
          </span>
          <span>·</span>
          <span>Motor RAG 1536d</span>
          <span>·</span>
          <span className="flex items-center gap-1 text-[#D4AF37]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] animate-pulse" />
            Evolution API
          </span>
        </div>
      </div>
    </div>
  );
};
