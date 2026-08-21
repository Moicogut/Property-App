import React, { useState } from 'react';
import { Building2, Search, LogIn, MapPin, Bed, Bath, Maximize, Sparkles, Eye } from 'lucide-react';
import { PropertyDetailModal } from './PropertyDetailModal';
import { SofiaButton } from './SofiaButton';
import { getSafeImageUrl } from '../utils/imageHelper';
import { PropertyLogo } from './brand/PropertyLogo';
import { SofiaPublicChatModal } from './chat/SofiaPublicChatModal';

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
  bedrooms: number;
  bathrooms: number;
  area?: number;
  areaSqm?: number;
  image_url?: string;
  images?: string[];
  type?: string;
}

interface Props {
  properties: Property[];
  onLoginClick: () => void;
  onOpenSofia?: () => void;
}

export const LandingPage: React.FC<Props> = ({ properties, onLoginClick, onOpenSofia }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [isSofiaModalOpen, setIsSofiaModalOpen] = useState(false);
  const [sofiaContextProperty, setSofiaContextProperty] = useState<Property | null>(null);

  const handleOpenSofiaDirect = (prop?: Property) => {
    setSofiaContextProperty(prop || null);
    setIsSofiaModalOpen(true);
    if (onOpenSofia) onOpenSofia();
  };

  const filteredProperties = properties.filter((p) => {
    const titleMatch = p.title || '';
    const locMatch = p.location || p.city || p.zone || '';
    const matchesSearch =
      titleMatch.toLowerCase().includes(searchTerm.toLowerCase()) ||
      locMatch.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || p.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-[#0B0D12] text-slate-100 font-sans relative selection:bg-[#D4AF37]/30 selection:text-[#F3E5AB]">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-40 bg-[#0B0D12]/90 backdrop-blur-md border-b border-slate-800/80 px-6 py-4 flex items-center justify-between">
        <PropertyLogo variant="horizontal" size="md" showTagline />

        <div className="flex items-center gap-3">
          {/* BOTÓN SOFÍA IA EN NAVBAR */}
          <button
            onClick={() => handleOpenSofiaDirect()}
            className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 border border-[#D4AF37]/30 text-[#F3E5AB] font-bold text-xs rounded-xl transition shadow-xs cursor-pointer hover:scale-105 active:scale-95"
          >
            <Sparkles className="w-4 h-4 text-[#D4AF37]" />
            <span className="hidden sm:inline">Sofía IA Asesora</span>
          </button>

          {/* BOTÓN LOGIN */}
          <button
            onClick={onLoginClick}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#D4AF37] via-[#E5C158] to-[#D4AF37] hover:brightness-110 text-slate-950 font-black text-xs rounded-xl shadow-lg shadow-[#D4AF37]/20 transition hover:scale-[1.02] tracking-wide cursor-pointer"
          >
            <LogIn className="w-4 h-4 text-slate-950" />
            <span className="hidden sm:inline">Acceso Usuarios / Admin</span>
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="relative pt-14 pb-16 px-6 max-w-7xl mx-auto text-center">
        {/* Glow ambient */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-[#D4AF37]/5 rounded-full blur-3xl pointer-events-none" />

        <button
          onClick={() => handleOpenSofiaDirect()}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#D4AF37]/10 border border-[#D4AF37]/25 text-[#F3E5AB] text-xs font-bold mb-6 hover:bg-[#D4AF37]/20 transition cursor-pointer hover:scale-105"
        >
          <Sparkles className="w-3.5 h-3.5 text-[#D4AF37]" />
          <span>Propiedades Seleccionadas & Asistencia IA con Sofía → Consultar</span>
        </button>

        <h2 className="text-4xl md:text-6xl font-black tracking-tight max-w-4xl mx-auto leading-tight text-white font-serif">
          Encuentra tu próximo espacio <span className="text-gold-gradient font-serif">exclusivo</span>
        </h2>
        <p className="mt-4 text-slate-400 text-sm md:text-base max-w-2xl mx-auto font-medium">
          Explora nuestro portafolio de alta gama en Bolivia. Haz clic en cualquier propiedad para ver la galería completa y detalles.
        </p>

        {/* BUSCADOR Y FILTROS */}
        <div className="mt-8 max-w-3xl mx-auto bg-[#111622]/90 border border-slate-800 p-3 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-3">
          <div className="flex-1 flex items-center gap-3 px-4 bg-[#090D16] rounded-xl border border-slate-800 focus-within:border-[#D4AF37] transition">
            <Search className="w-4 h-4 text-[#D4AF37]" />
            <input
              type="text"
              placeholder="Buscar por zona, ciudad o palabra clave..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-3 bg-transparent text-xs text-white focus:outline-none placeholder:text-slate-500 font-medium"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-3 bg-[#090D16] rounded-xl border border-slate-800 text-xs font-bold text-slate-300 focus:outline-none focus:border-[#D4AF37] cursor-pointer"
          >
            <option value="all">Todos los tipos</option>
            <option value="Casa">Casas</option>
            <option value="Departamento">Departamentos</option>
            <option value="Terreno">Terrenos</option>
            <option value="Oficina">Oficinas</option>
          </select>
        </div>
      </header>

      {/* CATÁLOGO DE INMUEBLES */}
      <main className="max-w-7xl mx-auto px-6 pb-24">
        {filteredProperties.length === 0 ? (
          <div className="text-center py-16 bg-[#111622]/50 rounded-3xl border border-slate-800">
            <p className="text-slate-400 text-xs">No hay inmuebles disponibles con esos criterios.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProperties.map((property) => {
              const coverImg = getSafeImageUrl(property);

              const price = property.price || property.priceUsd || 0;
              const location = property.location || (property.city && property.zone ? `${property.city}, ${property.zone}` : 'Ubicación a consultar');
              const area = property.area || property.areaSqm || 0;

              return (
                <div
                  key={property.id}
                  onClick={() => setSelectedProperty(property)}
                  className="group bg-[#111622]/90 border border-slate-800 hover:border-[#D4AF37]/50 rounded-3xl overflow-hidden shadow-xl transition-all duration-300 hover:-translate-y-1.5 cursor-pointer flex flex-col"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
                    <img
                      src={coverImg}
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80'; }}
                    />
                    <div className="absolute top-3 left-3 flex flex-col gap-1">
                      <span className="bg-[#090D16]/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-bold text-[#F3E5AB] border border-[#D4AF37]/30 w-max">
                        {property.type || 'Inmueble'}
                      </span>
                      <span className="bg-slate-900/90 backdrop-blur-md px-2 py-0.5 rounded-md text-[9px] font-mono text-slate-400 border border-slate-800 w-max">
                        Ref: {property.id.substring(0, 8)}
                      </span>
                    </div>
                    <div className="absolute bottom-3 right-3 bg-gradient-to-r from-[#D4AF37] to-[#AA8010] text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-xl backdrop-blur-md shadow-lg font-mono">
                      ${price > 0 ? price.toLocaleString() : 'Consulte'} USD
                    </div>
                    <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 text-white text-xs font-bold backdrop-blur-xs">
                      <Eye className="w-4 h-4 text-[#D4AF37]" />
                      <span>Ver Ficha Completa</span>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h4 className="font-bold text-base text-slate-100 group-hover:text-[#F3E5AB] transition line-clamp-1">
                        {property.title || 'Propiedad Inmobiliaria'}
                      </h4>
                      <p className="flex items-center gap-1.5 text-xs text-slate-400 mt-1.5 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-[#D4AF37] shrink-0" />
                        <span className="line-clamp-1">{location}</span>
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-800/80 text-slate-300 text-xs font-medium">
                      <div className="flex items-center gap-1.5">
                        <Bed className="w-4 h-4 text-slate-500" />
                        <span>{property.bedrooms || 0} Hab</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Bath className="w-4 h-4 text-slate-500" />
                        <span>{property.bathrooms || 0} Baños</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Maximize className="w-4 h-4 text-slate-500" />
                        <span>{area} m²</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* BOTÓN FLOTANTE SOFÍA IA */}
      <SofiaButton onClick={() => handleOpenSofiaDirect()} />

      {/* MODAL DE DETALLE EXPANDIDO */}
      <PropertyDetailModal
        property={selectedProperty}
        onClose={() => setSelectedProperty(null)}
        onOpenSofia={() => handleOpenSofiaDirect(selectedProperty || undefined)}
      />

      {/* MODAL DE CHAT CONCIERGE SOFÍA IA */}
      {isSofiaModalOpen && (
        <SofiaPublicChatModal
          isOpen={isSofiaModalOpen}
          onClose={() => setIsSofiaModalOpen(false)}
          properties={properties}
          initialProperty={sofiaContextProperty}
        />
      )}
    </div>
  );
};
