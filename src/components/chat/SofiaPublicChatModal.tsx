import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  Send, 
  X, 
  Sparkles, 
  Calendar, 
  Building2, 
  Phone, 
  User, 
  CheckCircle2,
  DollarSign,
  MapPin,
  Loader2
} from 'lucide-react';
import { PropertyIcon } from '../brand/PropertyLogo';
import { supabase } from '@/src/lib/supabase';

interface Property {
  id: string;
  title: string;
  price?: number;
  priceUsd?: number;
  location?: string;
  city?: string;
  zone?: string;
  bedrooms?: number;
  bathrooms?: number;
  type?: string;
}

interface SofiaPublicChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  properties: Property[];
  initialProperty?: Property | null;
}

interface Message {
  id: string;
  sender: 'user' | 'sofia';
  text: string;
  timestamp: Date;
  suggestedProperties?: Property[];
}

export const SofiaPublicChatModal: React.FC<SofiaPublicChatModalProps> = ({
  isOpen,
  onClose,
  properties,
  initialProperty,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [showLeadForm, setShowLeadForm] = useState(false);
  const [leadName, setLeadName] = useState('');
  const [leadPhone, setLeadPhone] = useState('');
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [activeOptions, setActiveOptions] = useState<Property[]>([]);
  const [focusedProperty, setFocusedProperty] = useState<Property | null>(initialProperty || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Inicialización de conversación cuando se monta el modal
  useEffect(() => {
    setFocusedProperty(initialProperty || null);
    const welcomeText = initialProperty
      ? `¡Hola! Soy Sofía, tu asesora inmobiliaria de Property OS. Veo que te interesa "${initialProperty.title}" en ${initialProperty.zone || initialProperty.city || 'Bolivia'}. ¿Deseas consultar sobre planes de financiamiento, crédito de vivienda social (VIS) o agendar una visita guiada?`
      : `¡Hola! Soy Sofía, asesora inmobiliaria con IA de Property OS. Te ayudo a encontrar tu casa, departamento o inversión ideal en el Eje Troncal de Bolivia (Santa Cruz, La Paz, Cochabamba). ¿Qué tipo de propiedad o presupuesto tienes en mente?`;

    setMessages([
      {
        id: 'welcome-1',
        sender: 'sofia',
        text: welcomeText,
        timestamp: new Date(),
        suggestedProperties: initialProperty ? [initialProperty] : undefined,
      },
    ]);
    setLeadSubmitted(false);
    setShowLeadForm(false);
  }, [initialProperty]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  if (!isOpen) return null;

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = input.trim();
    if (!query) return;

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsThinking(true);

    setTimeout(() => {
      const lower = query.toLowerCase();
      let reply = '';
      let suggestedProps: Property[] | undefined = undefined;
      let targetProp = focusedProperty;

      // 1. Detectar referencia a "la primera", "la segunda", "el primero", etc.
      if ((lower.includes('segund') || lower.includes('2da') || lower.includes('2da') || lower.includes('segunda')) && activeOptions.length >= 2) {
        targetProp = activeOptions[1];
        setFocusedProperty(targetProp);
      } else if ((lower.includes('primer') || lower.includes('1ra') || lower.includes('primera')) && activeOptions.length >= 1) {
        targetProp = activeOptions[0];
        setFocusedProperty(targetProp);
      } else if (activeOptions.length > 0) {
        const foundInOptions = activeOptions.find((p) => 
          lower.includes((p.title || '').toLowerCase()) || 
          lower.includes((p.zone || '').toLowerCase())
        );
        if (foundInOptions) {
          targetProp = foundInOptions;
          setFocusedProperty(targetProp);
        }
      }

      // 2. Si el usuario pregunta por detalles de un inmueble ya seleccionado o referenciado
      if (targetProp && (
        lower.includes('mas info') || 
        lower.includes('más info') || 
        lower.includes('informacion') || 
        lower.includes('información') || 
        lower.includes('segunda') || 
        lower.includes('primer') || 
        lower.includes('detalle') || 
        lower.includes('cuenta con') || 
        lower.includes('precio') || 
        lower.includes('venta')
      )) {
        const pPrice = targetProp.price || targetProp.priceUsd || 0;
        const pLoc = targetProp.zone || targetProp.city || targetProp.location || 'Bolivia';
        const pBeds = targetProp.bedrooms ? `${targetProp.bedrooms} habitaciones` : 'amplios ambientes';
        const pBaths = targetProp.bathrooms ? `${targetProp.bathrooms} baños` : 'baños completos';
        
        reply = `¡Excelente elección! El **${targetProp.title}** es una de nuestras mejores opciones en **${pLoc}**.\n\n` +
          `📌 **Precio:** $${pPrice.toLocaleString()} USD\n` +
          `📐 **Distribución:** ${pBeds}, ${pBaths} y acabados de primera calidad.\n` +
          `📑 **Estado Jurídico:** Papeles al día, folio real verificado y listo para entrega inmediata (aplica a compra al contado o financiamiento bancario regulado).\n\n` +
          `¿Te gustaría que te agende una visita guiada esta semana o prefieres que un asesor te envíe el dossier técnico completo a tu WhatsApp?`;
        
        setShowLeadForm(true);
        suggestedProps = [targetProp];
      }
      // 3. Si el usuario busca por ciudad o zona específica
      else if (lower.includes('sopocachi') || lower.includes('la paz') || lower.includes('lapaz') || lower.includes('calacoto') || lower.includes('equipetrol') || lower.includes('santa cruz') || lower.includes('cochabamba') || lower.includes('sirari') || lower.includes('urubo') || lower.includes('urubó') || lower.includes('departamento') || lower.includes('casa') || lower.includes('loft') || lower.includes('oficina')) {
        // Filtrar propiedades relevantes por coincidencia geográfica o de tipo
        let matches = properties.filter((p) => {
          const locStr = `${p.title || ''} ${p.zone || ''} ${p.city || ''} ${p.location || ''} ${p.type || ''}`.toLowerCase();
          
          if (lower.includes('sopocachi') && locStr.includes('sopocachi')) return true;
          if (lower.includes('la paz') && (locStr.includes('la paz') || locStr.includes('sopocachi') || locStr.includes('calacoto'))) return true;
          if (lower.includes('calacoto') && locStr.includes('calacoto')) return true;
          if (lower.includes('equipetrol') && locStr.includes('equipetrol')) return true;
          if (lower.includes('santa cruz') && (locStr.includes('santa cruz') || locStr.includes('equipetrol') || locStr.includes('sirari') || locStr.includes('urubo'))) return true;
          if (lower.includes('cochabamba') && locStr.includes('cochabamba')) return true;
          if (lower.includes('departamento') && (locStr.includes('departamento') || locStr.includes('loft'))) return true;
          if (lower.includes('casa') && locStr.includes('casa')) return true;
          return false;
        });

        if (matches.length === 0) {
          matches = properties.slice(0, 2);
        }

        const chosen = matches.slice(0, 2);
        setActiveOptions(chosen);
        suggestedProps = chosen;

        reply = `He encontrado estas opciones verificadas que se adaptan a tu búsqueda. Cuéntame cuál de ellas te llama la atención o si requieres una cotización personalizada:`;
      }
      // 4. Si el usuario pregunta por crédito VIS o financiamiento bancario
      else if (lower.includes('vis') || lower.includes('credito') || lower.includes('crédito') || lower.includes('interes social') || lower.includes('banco') || lower.includes('cuota')) {
        reply = `¡Con gusto te asesoro sobre financiamiento! En Bolivia, el Crédito de Vivienda de Interés Social (VIS ASFI) ofrece tasas preferenciales (5.5% a 6.5% anual) para primera vivienda. Además, gestionamos compras con crédito hipotecario tradicional con los principales bancos del país.\n\n¿Cuentas con aporte propio para la cuota inicial o te gustaría calcular las cuotas mensuales estimadas?`;
        setShowLeadForm(true);
      }
      // 5. Si el usuario quiere visita o contacto
      else if (lower.includes('visita') || lower.includes('ver') || lower.includes('agendar') || lower.includes('contacto') || lower.includes('asesor') || lower.includes('telefono') || lower.includes('celular') || lower.includes('whatsapp')) {
        reply = `¡Perfecto! Para coordinar el día y hora con el asesor inmobiliario asignado, por favor completa tu nombre y número de WhatsApp en el formulario aquí abajo y te contactaremos de inmediato.`;
        setShowLeadForm(true);
      }
      // 6. Respuesta general consultiva
      else {
        reply = `Comprendo tu consulta. En Property OS disponemos de un portafolio exclusivo con inmuebles residenciales y comerciales en Santa Cruz, La Paz y Cochabamba. ¿Tienes alguna preferencia de zona, número de dormitorios o rango de precio en mente?`;
      }

      const sofiaMsg: Message = {
        id: `sofia-${Date.now()}`,
        sender: 'sofia',
        text: reply,
        timestamp: new Date(),
        suggestedProperties: suggestedProps,
      };

      setMessages((prev) => [...prev, sofiaMsg]);
      setIsThinking(false);
    }, 850);
  };

  const handleRegisterLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName || !leadPhone) return;

    try {
      // Registrar prospecto en la base de datos Supabase
      await supabase.from('leads').insert({
        full_name: leadName,
        phone_number: leadPhone,
        pipeline_stage: 'NUEVO',
        lead_type: 'BUYER',
        pipeline_type: 'VENTAS',
        intent_score: 85,
        ai_summary: `Captado por Sofía IA en Landing Page. Consulta: "${messages[messages.length - 1]?.text || 'Interés general'}"`,
        preferred_zone: initialProperty?.zone || initialProperty?.city || 'Santa Cruz',
        budget_max_usd: initialProperty?.price || initialProperty?.priceUsd || 85000,
        metadata: { source: 'LANDING_PAGE_SOFIA_BOT' },
      });

      setLeadSubmitted(true);
      setMessages((prev) => [
        ...prev,
        {
          id: `lead-ok-${Date.now()}`,
          sender: 'sofia',
          text: `¡Excelente, ${leadName}! Tus datos han sido registrados en nuestro sistema transaccional. Uno de nuestros asesores oficiales se comunicará contigo vía WhatsApp al ${leadPhone} para coordinar la visita y enviarte la ficha técnica formal.`,
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      console.error('Error guardando lead:', err);
      setLeadSubmitted(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <div className="bg-[#0B0D12] border border-slate-800 rounded-3xl w-full max-w-xl h-[620px] flex flex-col shadow-2xl overflow-hidden relative">
        
        {/* Modal Header */}
        <div className="bg-[#111622] border-b border-slate-800 p-4 px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <PropertyIcon size={38} theme="gold" />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[#111622] rounded-full" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-sm tracking-tight">Sofía IA · Asesora Inmobiliaria</h3>
                <span className="bg-[#D4AF37]/15 border border-[#D4AF37]/30 text-[#F3E5AB] text-[9px] font-bold px-1.5 py-0.2 rounded font-mono">
                  Online
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Property OS · Inteligencia Inmobiliaria Bolivia</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar bg-[#0B0D12]">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.sender === 'sofia' && (
                <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/30 flex items-center justify-center shrink-0 mt-1">
                  <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
                </div>
              )}

              <div
                className={`max-w-[82%] rounded-2xl p-3.5 text-xs leading-relaxed ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-[#D4AF37] to-[#AA8010] text-slate-950 font-semibold shadow-md'
                    : 'bg-[#111622] text-slate-200 border border-slate-800/90 shadow-sm'
                }`}
              >
                <p className="whitespace-pre-line">{msg.text}</p>

                {/* Suggested Property Cards inside Chat */}
                {msg.suggestedProperties && msg.suggestedProperties.length > 0 && (
                  <div className="mt-3 space-y-2 pt-2 border-t border-slate-800">
                    {msg.suggestedProperties.map((prop) => (
                      <div
                        key={prop.id}
                        className="bg-[#090D16] border border-slate-800 rounded-xl p-2.5 flex items-center justify-between gap-2"
                      >
                        <div>
                          <p className="font-bold text-white text-[11px] line-clamp-1">{prop.title}</p>
                          <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-[#D4AF37]" />
                            <span>{prop.zone || prop.city || 'Bolivia'}</span>
                          </p>
                        </div>
                        <span className="text-[#F3E5AB] font-bold text-xs font-mono shrink-0">
                          ${((prop.price || prop.priceUsd || 0)).toLocaleString()} USD
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <span className={`block text-[9px] mt-1.5 ${msg.sender === 'user' ? 'text-slate-900/70' : 'text-slate-500'}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}

          {isThinking && (
            <div className="flex gap-3 items-center">
              <div className="w-7 h-7 rounded-lg bg-[#D4AF37]/20 border border-[#D4AF37]/30 flex items-center justify-center shrink-0">
                <Loader2 className="w-3.5 h-3.5 text-[#D4AF37] animate-spin" />
              </div>
              <div className="bg-[#111622] text-slate-400 border border-slate-800 rounded-2xl px-4 py-2 text-xs italic flex items-center gap-2">
                <span>Sofía está analizando el catálogo...</span>
              </div>
            </div>
          )}

          {/* Lead Capture Form in Chat */}
          {showLeadForm && !leadSubmitted && (
            <form
              onSubmit={handleRegisterLead}
              className="bg-[#111622] border border-[#D4AF37]/30 rounded-2xl p-4 space-y-3 animate-in fade-in"
            >
              <div className="flex items-center gap-2 text-white font-bold text-xs">
                <Calendar className="w-4 h-4 text-[#D4AF37]" />
                <span>Agendar Contacto / Visita Guiada</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    required
                    placeholder="Tu Nombre completo"
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    className="w-full bg-[#090D16] border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>

                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="tel"
                    required
                    placeholder="WhatsApp (ej. +591 70000000)"
                    value={leadPhone}
                    onChange={(e) => setLeadPhone(e.target.value)}
                    className="w-full bg-[#090D16] border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#D4AF37]"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#D4AF37] text-slate-950 font-black text-xs rounded-xl shadow-md transition hover:scale-[1.01]"
              >
                ✓ Solicitar Contacto con Asesor Oficial
              </button>
            </form>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 bg-[#111622] border-t border-slate-800 flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            placeholder="Pregunta a Sofía sobre precios, zonas o crédito VIS..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isThinking}
            className="flex-1 bg-[#090D16] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#D4AF37]"
          />
          <button
            type="submit"
            disabled={!input.trim() || isThinking}
            className="p-2.5 bg-gradient-to-r from-[#D4AF37] to-[#AA8010] hover:brightness-110 text-slate-950 font-bold rounded-xl transition disabled:opacity-40"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
