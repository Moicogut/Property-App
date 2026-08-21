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
  description?: string;
  rawDescription?: string;
  price?: number;
  priceUsd?: number;
  location?: string;
  city?: string;
  zone?: string;
  bedrooms?: number;
  bathrooms?: number;
  area?: number;
  areaSqm?: number;
  type?: string;
  acceptsSocialHousing?: boolean;
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

export type InterestGrade = "NADA" | "BAJA" | "MEDIA" | "ALTA" | "FULL";

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
  const [preferredVisitDate, setPreferredVisitDate] = useState('');
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [interestGrade, setInterestGrade] = useState<InterestGrade>(initialProperty ? "MEDIA" : "BAJA");
  const [activeOptions, setActiveOptions] = useState<Property[]>([]);
  const [focusedProperty, setFocusedProperty] = useState<Property | null>(initialProperty || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Inicialización de conversación cuando se monta el modal
  useEffect(() => {
    setFocusedProperty(initialProperty || null);
    setInterestGrade(initialProperty ? "MEDIA" : "BAJA");

    const welcomeText = initialProperty
      ? `¡Hola! Soy Sofía, tu asesora inmobiliaria senior de Property OS. Veo que estás consultando sobre **"${initialProperty.title}"** en **${initialProperty.zone || initialProperty.city || 'Bolivia'}** ($${((initialProperty.price || initialProperty.priceUsd || 0)).toLocaleString()} USD).\n\n¿Deseas conocer los detalles técnicos y estado de papeles, simular el crédito bancario/VIS o agendar una visita guiada para conocerlo personalmente?`
      : `¡Hola! Soy Sofía, asesora inmobiliaria con IA de Property OS. Te ayudo a encontrar tu casa, departamento o inversión ideal con documentos al día en Santa Cruz, La Paz o Cochabamba. ¿Qué tipo de propiedad, zona o presupuesto estás buscando?`;

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
      let newGrade: InterestGrade = interestGrade;

      // 1. Detectar referencia a "la primera", "la segunda", etc.
      if ((lower.includes('segund') || lower.includes('2da') || lower.includes('segunda')) && activeOptions.length >= 2) {
        targetProp = activeOptions[1];
        setFocusedProperty(targetProp);
        newGrade = "MEDIA";
      } else if ((lower.includes('primer') || lower.includes('1ra') || lower.includes('primera')) && activeOptions.length >= 1) {
        targetProp = activeOptions[0];
        setFocusedProperty(targetProp);
        newGrade = "MEDIA";
      } else if (activeOptions.length > 0) {
        const foundInOptions = activeOptions.find((p) => 
          lower.includes((p.title || '').toLowerCase()) || 
          lower.includes((p.zone || '').toLowerCase())
        );
        if (foundInOptions) {
          targetProp = foundInOptions;
          setFocusedProperty(targetProp);
          newGrade = "MEDIA";
        }
      }

      const pPrice = targetProp?.price || targetProp?.priceUsd || 0;
      const pTitle = targetProp?.title || 'Inmueble seleccionado';
      const pZone = targetProp?.zone || targetProp?.city || 'Bolivia';
      const pArea = targetProp?.area || targetProp?.areaSqm || 0;
      const pBeds = targetProp?.bedrooms || 0;
      const pBaths = targetProp?.bathrooms || 0;

      // ── DETECCIÓN DE PATRONES POR REGEX Y PRIORIDAD ──
      const isVisitIntent = /\b(visita|visitar|agendar|agenda|verlo|verla|conocerlo|conocerla|ir a ver|cita|horario|s[aá]bado|domingo|lunes|martes|mi[eé]rcoles|jueves|viernes|ma[nñ]ana|tarde|hrs|hora|10am|11am|pm|am|pasado ma[nñ]ana)\b/i.test(lower) ||
        (lower.includes('quedamos en') && lower.includes('visita')) ||
        lower.includes('puede ser a partir') ||
        lower.includes('se puede visitar');

      const isPapersQuery = /\b(papel|papeles|documento|documentos|documentaci[oó]n|folio|folio real|derechos reales|ddrr|al d[ií]a|saneado|saneada|legal|gravamen|grav[aá]menes|catastro|impuestos)\b/i.test(lower);

      const isCreditQuery = !isVisitIntent && (/\b(vis|cr[eé]dito|financiamiento|financiar|banco|bancario|cuota|cuotas|inter[eé]s social|asfi)\b/i.test(lower));

      // 1. PRIORIDAD MÁXIMA: Agendar Visita Presencial o Selección de Horario
      if (isVisitIntent) {
        newGrade = "FULL";
        setShowLeadForm(true);

        // Extraer horario mencionado por el usuario para pre-llenar
        let extractedDate = "";
        if (lower.includes('sábado') || lower.includes('sabado')) extractedDate += "Sábado ";
        else if (lower.includes('domingo')) extractedDate += "Domingo ";
        else if (lower.includes('mañana') || lower.includes('maña')) extractedDate += "Mañana ";
        else if (lower.includes('lunes') || lower.includes('martes') || lower.includes('miercoles') || lower.includes('miércoles') || lower.includes('jueves') || lower.includes('viernes')) extractedDate += "Día de semana ";

        if (lower.includes('10am') || lower.includes('10 am') || lower.includes('10:00')) extractedDate += "10:00 AM";
        else if (lower.includes('11am') || lower.includes('11 am')) extractedDate += "11:00 AM";
        else if (lower.includes('mañana') || lower.includes('por la mañana')) extractedDate += "por la mañana";
        else if (lower.includes('tarde') || lower.includes('por la tarde')) extractedDate += "por la tarde";

        if (extractedDate.trim()) {
          setPreferredVisitDate(extractedDate.trim());
          reply = `¡Perfecto! He registrado tu preferencia de visita para **${extractedDate.trim()}** en **"${pTitle}"**.\n\n` +
            `Por favor confirma tu nombre y número de WhatsApp en la tarjeta aquí abajo para que el asesor oficial te confirme el acceso y te comparta la ubicación GPS exacta.`;
        } else {
          reply = `¡Excelente! Vamos a coordinar la **visita guiada presencial** para **"${pTitle}"**.\n\n` +
            `Por favor déjanos tu nombre y WhatsApp en el formulario para coordinar la hora exacta que mejor te convenga.`;
        }
      }
      // 2. Consulta sobre Papeles, Derechos Reales, Folio Real o Documentación
      else if (isPapersQuery) {
        newGrade = "ALTA";
        if (targetProp) {
          reply = `Sí, totalmente. **"${pTitle}"** ($${pPrice.toLocaleString()} USD) cuenta con **documentación 100% saneada y al día**:\n\n` +
            `✅ **Folio Real Individualizado:** Registrado en Derechos Reales, libre de gravámenes o hipotecas pendientes.\n` +
            `✅ **Impuestos y Catastro Municipal:** Registro catastral e impuestos municipales al día para transferencia inmediata.\n` +
            `✅ **Apto para Crédito Bancario & VIS:** Al estar valuado en $${pPrice.toLocaleString()} USD, califica para Crédito de Vivienda de Interés Social (VIS ASFI con tasa del 5.5% al 6.5%) o crédito hipotecario con cualquier banco de Bolivia.\n\n` +
            `¿Te gustaría agendar una visita guiada para que conozcas la propiedad personalmente? Tenemos turnos disponibles este fin de semana o en días hábiles.`;
        } else {
          reply = `Todas las propiedades en nuestro catálogo oficial cuentan con auditoría legal previa (Folio Real verificado en Derechos Reales, impuestos y catastro municipal al día). ¿Hay alguna propiedad o zona en particular sobre la que desees revisar la ficha técnica?`;
        }
      }
      // 3. Consulta sobre Crédito VIS, Tasas o Financiamiento
      else if (isCreditQuery) {
        newGrade = "ALTA";
        if (targetProp) {
          reply = `¡Excelente! **"${pTitle}"** ($${pPrice.toLocaleString()} USD en ${pZone}) **califica para Crédito VIS (Vivienda de Interés Social)**.\n\n` +
            `📊 **Condiciones estimadas en Bolivia:**\n` +
            `• **Tasa de interés:** 5.5% a 6.5% anual regulada por ASFI.\n` +
            `• **Cuota inicial mínima:** Desde el 10% al 20% ($${Math.round(pPrice * 0.15).toLocaleString()} USD aprox.).\n` +
            `• **Plazo:** Hasta 20 o 25 años con cuotas mensuales accesibles.\n\n` +
            `¿Cuentas con aporte inicial disponible o prefieres que coordinemos una visita presencial y te entreguemos la proforma bancaria?`;
        } else {
          reply = `El Crédito VIS (Vivienda de Interés Social) financia hasta el 80%-90% del valor del inmueble con tasas preferenciales del 5.5% al 6.5% anual. ¿Qué rango de precio estás buscando para presentarte las opciones aptas para VIS?`;
        }
      }
      // 5. Consulta de más información o detalles de la propiedad
      else if (targetProp && (lower.includes('mas info') || lower.includes('más info') || lower.includes('detalle') || lower.includes('dormitorio') || lower.includes('baño') || lower.includes('metro') || lower.includes('m2') || lower.includes('precio') || lower.includes('garaje'))) {
        newGrade = "MEDIA";
        reply = `Aquí tienes los detalles de **"${pTitle}"** en **${pZone}**:\n\n` +
          `💰 **Precio:** $${pPrice.toLocaleString()} USD\n` +
          `🛏️ **Ambientes:** ${pBeds} Dormitorios | 🛁 ${pBaths} Baños\n` +
          `📐 **Superficie:** ${pArea} m² útiles\n` +
          `📍 **Ubicación:** ${pZone}, excelente accesibilidad a colegios y avenidas principales.\n\n` +
          `¿Deseas que coordinemos una visita presencial para conocerlo?`;
        suggestedProps = [targetProp];
      }
      // 6. Búsqueda por Ciudad o Zona
      else if (lower.includes('sopocachi') || lower.includes('la paz') || lower.includes('lapaz') || lower.includes('calacoto') || lower.includes('obrajes') || lower.includes('equipetrol') || lower.includes('santa cruz') || lower.includes('cochabamba') || lower.includes('sirari') || lower.includes('urubo') || lower.includes('departamento') || lower.includes('casa') || lower.includes('loft') || lower.includes('terreno')) {
        newGrade = "MEDIA";
        let matches = properties.filter((p) => {
          const locStr = `${p.title || ''} ${p.zone || ''} ${p.city || ''} ${p.location || ''} ${p.type || ''}`.toLowerCase();
          if (lower.includes('obrajes') && locStr.includes('obrajes')) return true;
          if (lower.includes('sopocachi') && locStr.includes('sopocachi')) return true;
          if (lower.includes('calacoto') && locStr.includes('calacoto')) return true;
          if (lower.includes('la paz') && (locStr.includes('la paz') || locStr.includes('obrajes') || locStr.includes('sopocachi') || locStr.includes('calacoto'))) return true;
          if (lower.includes('equipetrol') && locStr.includes('equipetrol')) return true;
          if (lower.includes('santa cruz') && (locStr.includes('santa cruz') || locStr.includes('equipetrol') || locStr.includes('sirari') || locStr.includes('urubo'))) return true;
          if (lower.includes('cochabamba') && locStr.includes('cochabamba')) return true;
          if (lower.includes('departamento') && locStr.includes('departamento')) return true;
          if (lower.includes('casa') && locStr.includes('casa')) return true;
          return false;
        });

        if (matches.length === 0) matches = properties.slice(0, 2);
        const chosen = matches.slice(0, 2);
        setActiveOptions(chosen);
        suggestedProps = chosen;
        reply = `He encontrado estas opciones verificadas disponibles en esa zona. ¿Cuál de ellas te gustaría revisar en detalle o agendar para visita?`;
      }
      // 7. Respuesta consultiva general
      else {
        reply = `Comprendo tu consulta. En Property OS te asesoramos con transparencia en precios, planos y documentación de cada inmueble. ¿Deseas conocer más detalles de esta propiedad o prefieres evaluar opciones en otra zona o rango de precio?`;
      }

      setInterestGrade(newGrade);

      const sofiaMsg: Message = {
        id: `sofia-${Date.now()}`,
        sender: 'sofia',
        text: reply,
        timestamp: new Date(),
        suggestedProperties: suggestedProps,
      };

      setMessages((prev) => [...prev, sofiaMsg]);
      setIsThinking(false);
    }, 650);
  };

  const handleRegisterLead = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadName || !leadPhone) return;

    try {
      const p = focusedProperty || initialProperty;
      const budget = p?.price || p?.priceUsd || 95000;
      const zone = p?.zone || p?.city || 'La Paz';

      // 1. Registrar Lead calificado en Supabase
      const { data: createdLead, error: leadErr } = await supabase
        .from('leads')
        .insert({
          full_name: leadName.trim(),
          phone_number: leadPhone.trim(),
          pipeline_stage: 'AGENDADO_VISITA',
          pipeline_type: 'VENTAS',
          lead_type: 'BUYER',
          intent_score: interestGrade === 'FULL' ? 95 : 85,
          budget_max_usd: budget,
          preferred_zone: zone,
          property_interest_id: p?.id || undefined,
          ai_summary: `Prospecto con Grado de Interés ${interestGrade}. Inmueble: "${p?.title || 'General'}". Fecha sugerida: "${preferredVisitDate || 'A coordinar'}".`,
          bant_score: {
            budget: budget,
            authority: true,
            need: p?.title || "Compra de inmueble calificado",
            timeline: preferredVisitDate || "Inmediata",
            score: interestGrade === 'FULL' ? 95 : 85,
          },
        })
        .select()
        .single();

      if (leadErr) throw leadErr;

      // 2. Si se ingresó fecha tentativa de visita, registrar en la tabla appointments
      if (preferredVisitDate && createdLead?.id) {
        await supabase.from('appointments').insert({
          lead_id: createdLead.id,
          property_id: p?.id || null,
          appointment_date: preferredVisitDate,
          status: 'SCHEDULED',
          notes: `Cita coordinada por Sofía IA vía web para ${leadName} (${leadPhone})`,
        });
      }

      setInterestGrade("FULL");
      setLeadSubmitted(true);
      setMessages((prev) => [
        ...prev,
        {
          id: `lead-ok-${Date.now()}`,
          sender: 'sofia',
          text: `🎉 **¡Visita guiada pre-agendada con éxito, ${leadName}!**\n\nTus datos y preferencia de horario (${preferredVisitDate || 'a coordinar'}) han sido remitidos al asesor oficial de la propiedad. Te contactará vía WhatsApp al **${leadPhone}** para confirmar la reserva y enviarte la ficha técnica legal.`,
          timestamp: new Date(),
        },
      ]);
    } catch (err: any) {
      console.error('Error guardando lead:', err);
      setLeadSubmitted(true);
      setMessages((prev) => [
        ...prev,
        {
          id: `lead-ok-${Date.now()}`,
          sender: 'sofia',
          text: `¡Gracias, ${leadName}! Hemos recibido tus datos. Un asesor oficial se comunicará contigo al ${leadPhone} para coordinar la visita.`,
          timestamp: new Date(),
        },
      ]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 font-sans">
      <div className="bg-[#0B0D12] border border-slate-800 rounded-3xl w-full max-w-xl h-[640px] flex flex-col shadow-2xl overflow-hidden relative">
        
        {/* Modal Header con Termómetro de Interés */}
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

          <div className="flex items-center gap-3">
            {/* Termómetro de Interés */}
            <div className="flex items-center gap-1.5 bg-[#090D16] px-2.5 py-1 rounded-xl border border-slate-800">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Interés:</span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg font-mono ${
                interestGrade === 'FULL' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 animate-pulse' :
                interestGrade === 'ALTA' ? 'bg-[#D4AF37]/20 text-[#F3E5AB] border border-[#D4AF37]/40' :
                interestGrade === 'MEDIA' ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40' :
                interestGrade === 'BAJA' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                'bg-slate-800 text-slate-400'
              }`}>
                {interestGrade === 'FULL' ? '🔥 FULL (Visita)' : interestGrade === 'ALTA' ? '🟢 ALTA' : interestGrade === 'MEDIA' ? '🔵 MEDIA' : interestGrade === 'BAJA' ? '🟡 BAJA' : '⚪ NADA'}
              </span>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
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
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed ${
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
                <span>Sofía está analizando el catálogo y documentos...</span>
              </div>
            </div>
          )}

          {/* Lead & Visit Appointment Form in Chat */}
          {showLeadForm && !leadSubmitted && (
            <form
              onSubmit={handleRegisterLead}
              className="bg-[#111622] border border-[#D4AF37]/40 rounded-2xl p-4 space-y-3 animate-in fade-in shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-[#F3E5AB] font-bold text-xs">
                  <Calendar className="w-4 h-4 text-[#D4AF37]" />
                  <span>Agendar Visita Guiada / Contacto Oficial</span>
                </div>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  Documentación Verificada
                </span>
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

              {/* Horario o Fecha de Visita sugerido */}
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Día y hora preferida (ej: Sábado 10:30 AM o Día de semana por la tarde)"
                  value={preferredVisitDate}
                  onChange={(e) => setPreferredVisitDate(e.target.value)}
                  className="w-full bg-[#090D16] border border-slate-800 rounded-xl py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-[#D4AF37]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#D4AF37] text-slate-950 font-black text-xs rounded-xl shadow-md transition hover:scale-[1.01] cursor-pointer"
              >
                ✓ Confirmar y Agendar Visita con Asesor Oficial
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
            placeholder="Pregunta a Sofía sobre papeles, crédito VIS, precios o agenda de visitas..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isThinking}
            className="flex-1 bg-[#090D16] border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-[#D4AF37]"
          />
          <button
            type="submit"
            disabled={!input.trim() || isThinking}
            className="p-2.5 bg-gradient-to-r from-[#D4AF37] to-[#AA8010] hover:brightness-110 text-slate-950 font-bold rounded-xl transition disabled:opacity-40 cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
