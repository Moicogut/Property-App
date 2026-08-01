import React, { useState } from "react";
import { Building2, Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck, Sparkles } from "lucide-react";
import { signIn, signUp } from "@/src/lib/auth";
import type { AppUser } from "@/src/types/property";

interface LoginPageProps {
  onAuthSuccess: (user: AppUser) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onAuthSuccess }) => {
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
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center p-4 relative overflow-hidden">
      
      {/* Animated background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-emerald-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1.5s" }} />
      </div>

      <div className="w-full max-w-md relative z-10">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center font-black text-white text-3xl shadow-2xl shadow-emerald-500/30 mx-auto mb-4">
            P
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            PROPERTY <span className="text-emerald-400">OS</span>
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            CRM Inmobiliario con IA · Eje Troncal Bolivia
          </p>
        </div>

        {/* Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-sm">
          
          {/* Mode Switcher */}
          <div className="flex bg-slate-800 rounded-lg p-1 mb-6">
            {(["login", "register"] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); setSuccessMsg(null); }}
                className={`flex-1 py-2 text-xs font-bold rounded-md transition-all ${
                  mode === m
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
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
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Nombre Completo
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Tu nombre y apellido"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  required
                />
              </div>
            )}

            {/* Email */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@agencia.com"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 pl-10 text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 pl-10 pr-11 text-sm text-white placeholder-slate-500 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all"
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
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-medium px-4 py-3 rounded-xl">
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
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed text-slate-950 font-black py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
              {isLoading
                ? "Verificando..."
                : mode === "login"
                ? "Acceder al CRM"
                : "Crear mi Cuenta"}
            </button>
          </form>

          {/* Footer Info */}
          <div className="mt-6 pt-5 border-t border-slate-800 flex items-center justify-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500/60" />
            <span>Autenticación segura vía Supabase Auth</span>
          </div>
        </div>

        {/* Bottom branding */}
        <div className="text-center mt-6 flex items-center justify-center gap-4 text-xs text-slate-600">
          <span className="flex items-center gap-1">
            <Building2 className="w-3 h-3" /> Eje Troncal Bolivia
          </span>
          <span>·</span>
          <span>Motor RAG 1536d</span>
          <span>·</span>
          <span className="flex items-center gap-1 text-emerald-700">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Evolution API
          </span>
        </div>
      </div>
    </div>
  );
};
