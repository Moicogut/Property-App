import React, { useEffect } from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface Props {
  message: string;
  isOpen: boolean;
  onClose: () => void;
}

export const SaveToast: React.FC<Props> = ({ message, isOpen, onClose }) => {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 bg-emerald-900/90 text-white px-5 py-3.5 rounded-2xl shadow-2xl backdrop-blur-md border border-emerald-500/30 animate-in slide-in-from-bottom-5">
      <CheckCircle2 className="w-6 h-6 text-emerald-400 shrink-0" />
      <div className="text-sm">
        <p className="font-semibold text-emerald-100">¡Guardado Exitoso!</p>
        <p className="text-emerald-200/80 text-xs">{message}</p>
      </div>
      <button
        onClick={onClose}
        className="ml-3 p-1 text-emerald-300 hover:text-white rounded-lg hover:bg-white/10 transition"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};
