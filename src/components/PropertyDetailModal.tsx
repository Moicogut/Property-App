import React, { useState } from 'react';
import { X, MapPin, Bed, Bath, Maximize, Phone, MessageSquare, ChevronLeft, ChevronRight, Sparkles, Calculator } from 'lucide-react';
import { getSafeImageUrl, getSafeImageArray } from '../utils/imageHelper';
import { MortgageCalculatorModal } from './modals/MortgageCalculatorModal';
import { getPropertyCategory } from './LandingPage';

interface Property {
  id: string;
  title: string;
  description?: string;
  rawDescription?: string; // Para compatibilidad
  price?: number;
  priceUsd?: number; // Para compatibilidad
  location?: string;
  city?: string;
  zone?: string;
  bedrooms: number;
  bathrooms: number;
  area?: number;
  areaSqm?: number;
  image_url?: string;
  images?: string[];
  type?: string;
}

interface Props {
  property: Property | null;
  onClose: () => void;
  onOpenSofia?: () => void;
}

export const PropertyDetailModal: React.FC<Props> = ({ property, onClose, onOpenSofia }) => {
  if (!property) return null;

  const [showCalculatorModal, setShowCalculatorModal] = useState(false);

  // Colección de imágenes (prioriza el arreglo images o image_url)
  const safeCoverUrl = getSafeImageUrl(property);
  let gallery = getSafeImageArray(property);
  
  // Asegurar que haya al menos una imagen válida en la galería
  if (gallery.length === 0) {
    gallery = [safeCoverUrl];
  }

  const [currentImgIndex, setCurrentImgIndex] = useState(0);

  const nextImage = () => setCurrentImgIndex((prev) => (prev + 1) % gallery.length);
  const prevImage = () => setCurrentImgIndex((prev) => (prev - 1 + gallery.length) % gallery.length);

  const whatsappMessage = encodeURIComponent(
    `Hola, me interesa obtener más información sobre la propiedad: ${property.title} (Código: ${property.id.substring(0, 8)})`
  );

  const price = property.price || property.priceUsd || 0;
  const area = property.area || property.areaSqm || 0;
  const location = property.location || (property.city && property.zone ? `${property.city}, ${property.zone}` : 'Ubicación a consultar');
  const description = property.description || property.rawDescription || 'Esta exclusiva propiedad cuenta con excelentes acabados, ubicación privilegiada y espacios optimizados para brindar la máxima comodidad.';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row overflow-y-auto custom-scrollbar">
        
        {/* BOTÓN CERRAR */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 bg-slate-950/70 hover:bg-slate-950 text-slate-300 hover:text-white rounded-full backdrop-blur-md border border-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* COLUMNA IZQUIERDA: GALERÍA DE 6 FOTOS */}
        <div className="w-full md:w-1/2 bg-slate-950 flex flex-col justify-between relative min-h-[300px]">
          {/* Imagen Principal */}
          <div className="relative w-full h-full min-h-[280px] md:min-h-[400px]">
            <img
              src={gallery[currentImgIndex]}
              alt={property.title}
              className="w-full h-full object-cover"
              onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80'; }}
            />
            
            {/* Controles del Carrusel */}
            {gallery.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/70 text-white hover:bg-indigo-600 transition"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/70 text-white hover:bg-indigo-600 transition"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            <div className="absolute top-4 left-4 bg-gradient-to-r from-[#D4AF37] to-[#AA8010] text-slate-950 font-black text-xs px-3.5 py-1 rounded-full uppercase tracking-wider shadow-lg">
              {getPropertyCategory(property)}
            </div>
          </div>

          {/* Miniaturas de la Galería */}
          {gallery.length > 1 && (
            <div className="p-3 bg-slate-950/90 flex gap-2 overflow-x-auto border-t border-slate-800 custom-scrollbar">
              {gallery.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrentImgIndex(idx)}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition ${
                    currentImgIndex === idx ? 'border-indigo-500 scale-105' : 'border-slate-800 opacity-60'
                  }`}
                >
                  <img 
                    src={img} 
                    alt={`Thumb ${idx}`} 
                    className="w-full h-full object-cover"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80'; }}
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: INFORMACIÓN DETALLADA */}
        <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between space-y-6">
          <div>
            <div className="flex justify-between items-start gap-4">
              <h3 className="text-2xl font-bold text-white leading-snug">{property.title}</h3>
              <div className="text-right shrink-0">
                <span className="text-2xl font-extrabold text-indigo-400">
                  ${price.toLocaleString()} USD
                </span>
              </div>
            </div>

            <p className="flex items-center gap-1.5 text-sm text-slate-400 mt-2">
              <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>{location}</span>
            </p>

            {/* Ficha Técnica */}
            <div className="grid grid-cols-3 gap-3 my-6 p-4 bg-slate-950/60 rounded-2xl border border-slate-800 text-slate-200">
              <div className="flex flex-col items-center text-center">
                <Bed className="w-5 h-5 text-indigo-400 mb-1" />
                <span className="text-xs text-slate-400">Habitaciones</span>
                <span className="font-bold text-sm">{property.bedrooms || 0}</span>
              </div>
              <div className="flex flex-col items-center text-center border-x border-slate-800">
                <Bath className="w-5 h-5 text-indigo-400 mb-1" />
                <span className="text-xs text-slate-400">Baños</span>
                <span className="font-bold text-sm">{property.bathrooms || 0}</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <Maximize className="w-5 h-5 text-indigo-400 mb-1" />
                <span className="text-xs text-slate-400">Área</span>
                <span className="font-bold text-sm">{area} m²</span>
              </div>
            </div>

            {/* Descripción */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">Descripción</h4>
              <p className="text-slate-300 text-sm leading-relaxed max-h-36 overflow-y-auto pr-2 custom-scrollbar whitespace-pre-line">
                {description}
              </p>
            </div>
          </div>

          {/* BOTONES DE ACCIÓN & ASISTENCIA DE SOFÍA */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            {/* Botón de Cotización Financiera & Amortización */}
            <button
              onClick={() => setShowCalculatorModal(true)}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-teal-300 rounded-xl text-xs font-bold transition shadow-sm"
            >
              <Calculator className="w-4 h-4 text-teal-400" />
              <span>📊 Simular Crédito & Tabla de Amortización</span>
            </button>

            {onOpenSofia && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSofia();
                }}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-gradient-to-r from-violet-600/20 to-indigo-600/20 hover:from-violet-600/30 hover:to-indigo-600/30 border border-violet-500/30 text-violet-300 rounded-xl text-xs font-semibold transition"
              >
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span>Consultar a Sofía IA sobre esta propiedad</span>
              </button>
            )}

            <a
              href={`https://wa.me/?text=${whatsappMessage}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl shadow-lg transition"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Contactar Agente por WhatsApp</span>
            </a>
          </div>
        </div>
      </div>

      {showCalculatorModal && (
        <MortgageCalculatorModal
          isOpen={showCalculatorModal}
          onClose={() => setShowCalculatorModal(false)}
          property={{
            id: property.id,
            organizationId: 'org-1',
            title: property.title,
            city: property.city || 'Santa Cruz',
            zone: property.zone || 'Equipetrol',
            priceUsd: price,
            bedrooms: property.bedrooms,
            bathrooms: property.bathrooms,
            areaSqm: area,
            acceptsSocialHousing: true,
            status: 'AVAILABLE',
            rawDescription: description,
          }}
        />
      )}
    </div>
  );
};
