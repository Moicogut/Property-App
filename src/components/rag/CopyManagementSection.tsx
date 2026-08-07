import React, { useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Sparkles, Save, Trash2, Check, Copy } from 'lucide-react';
import { Property } from '@/src/types/property';

interface CopyManagementSectionProps {
  property: Property;
}

interface PropertyCopy {
  id: string;
  copy_text: string;
  image_prompt: string | null;
  platform: string;
  created_at: string;
}

export const CopyManagementSection: React.FC<CopyManagementSectionProps> = ({ property }) => {
  const [copies, setCopies] = useState<PropertyCopy[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  const [generatedCopy, setGeneratedCopy] = useState('');
  const [generatedPrompt, setGeneratedPrompt] = useState('');
  const [loadingCopy, setLoadingCopy] = useState(false);
  
  const [copiedText, setCopiedText] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editPrompt, setEditPrompt] = useState('');

  useEffect(() => {
    loadHistory();
  }, [property.id]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('property_copies')
        .select('*')
        .eq('property_id', property.id)
        .order('created_at', { ascending: false });
        
      if (!error && data) {
        setCopies(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleGenerate = async () => {
    setLoadingCopy(true);
    setGeneratedCopy('');
    setGeneratedPrompt('');
    
    try {
      const res = await fetch("/api/ai/generate-copy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ propertyId: property.id })
      });
      const data = await res.json();
      
      if (data.copy) {
        // Parse the response to separate copy and prompt if possible
        const fullText = data.copy as string;
        let mainCopy = fullText;
        let imgPrompt = '';
        
        // Simple extraction based on the known format "PROMPT DE IMAGEN IA"
        const promptMarker = "PROMPT DE IMAGEN IA";
        const idx = fullText.indexOf(promptMarker);
        if (idx !== -1) {
          mainCopy = fullText.substring(0, idx).trim();
          imgPrompt = fullText.substring(idx).replace(promptMarker, "").replace("(Midjourney / DALL-E / Flux):", "").trim();
        }
        
        setGeneratedCopy(mainCopy);
        setGeneratedPrompt(imgPrompt);
      } else {
        alert("Error: " + (data.error || "No se pudo generar el copy."));
      }
    } catch (e) {
      alert("Error generando copy.");
    } finally {
      setLoadingCopy(false);
    }
  };

  const handleSaveToHistory = async () => {
    if (!generatedCopy) return;
    
    try {
      const { data, error } = await supabase
        .from('property_copies')
        .insert({
          property_id: property.id,
          copy_text: generatedCopy,
          image_prompt: generatedPrompt || null,
          platform: 'GENERAL'
        })
        .select()
        .single();
        
      if (!error && data) {
        setCopies([data, ...copies]);
        setGeneratedCopy('');
        setGeneratedPrompt('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id: string) => {
    setCopies(copies.filter(c => c.id !== id));
    await supabase.from('property_copies').delete().eq('id', id);
  };

  const handleUpdate = async (id: string) => {
    try {
      const { error } = await supabase
        .from('property_copies')
        .update({ copy_text: editText, image_prompt: editPrompt || null })
        .eq('id', id);
        
      if (!error) {
        setCopies(copies.map(c => c.id === id ? { ...c, copy_text: editText, image_prompt: editPrompt } : c));
        setEditingId(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-4">
      {/* Generador */}
      <button 
        disabled={loadingCopy}
        onClick={handleGenerate}
        className="w-full py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold rounded-lg border border-blue-200 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-70"
      >
        <Sparkles className={`w-4 h-4 ${loadingCopy ? 'animate-spin' : ''}`} />
        {loadingCopy ? 'Generando Copy...' : 'Generar Copy para Redes'}
      </button>

      {generatedCopy && (
        <div className="p-4 bg-slate-800 rounded-lg border border-slate-700 animate-in fade-in zoom-in duration-300">
          <div className="flex justify-between items-center mb-3">
            <label className="text-sm font-semibold text-emerald-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> 
              Nuevo Copy Generado
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(generatedCopy);
                  setCopiedText(true);
                  setTimeout(() => setCopiedText(false), 2000);
                }}
                className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold rounded transition-colors flex items-center gap-1"
              >
                {copiedText ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedText ? 'Copiado' : 'Copiar'}
              </button>
              <button
                onClick={handleSaveToHistory}
                className="px-3 py-1 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded transition-colors flex items-center gap-1"
              >
                <Save className="w-3 h-3" />
                Guardar en Historial
              </button>
            </div>
          </div>
          
          <textarea
            value={generatedCopy}
            onChange={(e) => setGeneratedCopy(e.target.value)}
            rows={8}
            className="w-full p-3 bg-slate-900 text-slate-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500 custom-scrollbar resize-none mb-3"
            placeholder="Texto principal del copy..."
          />
          
          {generatedPrompt && (
            <div>
              <label className="text-xs font-semibold text-indigo-400 mb-1 flex justify-between">
                <span>Prompt de Imagen (Midjourney / DALL-E)</span>
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(generatedPrompt);
                    setCopiedPrompt(true);
                    setTimeout(() => setCopiedPrompt(false), 2000);
                  }}
                  className="text-indigo-300 hover:text-indigo-200 flex items-center gap-1"
                >
                  {copiedPrompt ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  {copiedPrompt ? 'Copiado' : 'Copiar'}
                </button>
              </label>
              <textarea
                value={generatedPrompt}
                onChange={(e) => setGeneratedPrompt(e.target.value)}
                rows={3}
                className="w-full p-2 bg-indigo-950/30 text-indigo-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 custom-scrollbar resize-none"
              />
            </div>
          )}
        </div>
      )}

      {/* Historial */}
      {copies.length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-bold text-slate-700 mb-3 border-b border-slate-200 pb-2">Historial de Copies</h4>
          <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
            {copies.map(copy => (
              <div key={copy.id} className="p-3 bg-white border border-slate-200 rounded-lg shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">
                    {new Date(copy.created_at).toLocaleDateString()} {new Date(copy.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>
                  
                  {editingId === copy.id ? (
                    <div className="flex gap-1.5">
                      <button onClick={() => setEditingId(null)} className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs rounded font-bold">Cancelar</button>
                      <button onClick={() => handleUpdate(copy.id)} className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 text-xs rounded font-bold">Guardar</button>
                    </div>
                  ) : (
                    <div className="flex gap-1.5">
                      <button 
                        onClick={() => {
                          setEditingId(copy.id);
                          setEditText(copy.copy_text);
                          setEditPrompt(copy.image_prompt || '');
                        }} 
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                        title="Editar"
                      >
                        <Save className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(copy.copy_text);
                        }} 
                        className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                        title="Copiar Texto"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => handleDelete(copy.id)} 
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                
                {editingId === copy.id ? (
                  <div className="space-y-2 mt-2">
                    <textarea
                      value={editText}
                      onChange={e => setEditText(e.target.value)}
                      rows={5}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <label className="text-[10px] font-bold text-slate-500">Prompt de Imagen</label>
                    <textarea
                      value={editPrompt}
                      onChange={e => setEditPrompt(e.target.value)}
                      rows={2}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                ) : (
                  <div>
                    <div className="text-xs text-slate-700 whitespace-pre-wrap">{copy.copy_text}</div>
                    {copy.image_prompt && (
                      <div className="mt-3 p-2 bg-indigo-50 border border-indigo-100 rounded text-[10px] text-indigo-800">
                        <span className="font-bold flex items-center justify-between mb-1">
                          🎨 Prompt de Imagen:
                          <button onClick={() => navigator.clipboard.writeText(copy.image_prompt!)} className="text-indigo-500 hover:text-indigo-700">Copiar</button>
                        </span>
                        {copy.image_prompt}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
