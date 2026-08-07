import React from 'react';
import { Sparkles } from 'lucide-react';

interface Props {
  onClick: () => void;
}

export const SofiaButton: React.FC<Props> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="fixed bottom-6 left-6 z-40 flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white rounded-full shadow-2xl shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-all group border border-indigo-400/30"
      title="Consultar con Sofía IA"
    >
      <div className="relative flex items-center justify-center p-1.5 bg-white/20 rounded-full">
        <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
      </div>
      <div className="text-left pr-1">
        <p className="text-xs font-bold leading-tight">Sofía IA</p>
        <p className="text-[10px] text-indigo-200">Asistente Inmobiliaria</p>
      </div>
    </button>
  );
};
