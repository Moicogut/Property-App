import React, { useState } from 'react';
import { Building2, Search, LogIn, MapPin, Bed, Bath, Maximize, Sparkles, Eye } from 'lucide-react';
import { PropertyDetailModal } from './PropertyDetailModal';
import { SofiaButton } from './SofiaButton';
import { getSafeImageUrl } from '../utils/imageHelper';

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
  onOpenSofia: () => void;
}

export const LandingPage: React.FC<Props> = ({ properties, onLoginClick, onOpenSofia }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);

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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans relative">
      {/* NAVBAR */}
      <nav className="sticky top-0 z-40 bg-slate-900/80 backdrop-blur-md border-b border-slate-800/80 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-indigo-600 to-violet-500 rounded-xl shadow-lg shadow-indigo-500/20">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-lg leading-none bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-200 to-slate-400">
              Inmobiliaria Exclusive
            </h1>
            <span className="text-[10px] text-indigo-400 font-semibold tracking-wider uppercase">
              Catálogo Privado & Residencial
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* BOTÓN SOFÍA IA EN NAVBAR */}
          <button
            onClick={onOpenSofia}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 font-medium text-xs rounded-xl transition"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span className="hidden sm:inline">Sofía IA</span>
          </button>

          {/* BOTÓN LOGIN */}
          <button
            onClick={onLoginClick}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-indigo-500/25 transition hover:scale-[1.02]"
          >
            <LogIn className="w-4 h-4" />
            <span className="hidden sm:inline">Acceso Usuarios / Admin</span>
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <header className="relative pt-12 pb-16 px-6 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Propiedades Seleccionadas & Asistencia IA con Sofía</span>
        </div>

        <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
          Encuentra tu próximo espacio exclusivo
        </h2>
        <p className="mt-4 text-slate-400 text-base md:text-lg max-w-2xl mx-auto">
          Explora nuestro portafolio. Haz clic en cualquier propiedad para ver la galería completa y detalles.
        </p>

        {/* BUSCADOR Y FILTROS */}
        <div className="mt-8 max-w-3xl mx-auto bg-slate-900/90 border border-slate-800 p-3 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-3">
          <div className="flex-1 flex items-center gap-3 px-4 bg-slate-950/60 rounded-xl border border-slate-800/60">
            <Search className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por zona, ciudad o palabra clave..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-3 bg-transparent text-sm text-white focus:outline-none placeholder:text-slate-500"
            />
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-4 py-3 bg-slate-950/60 rounded-xl border border-slate-800/60 text-sm text-slate-300 focus:outline-none cursor-pointer"
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
          <div className="text-center py-16 bg-slate-900/50 rounded-3xl border border-slate-800">
            <p className="text-slate-400">No hay inmuebles disponibles con esos criterios.</p>
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
                  className="group bg-slate-900/70 border border-slate-800 hover:border-indigo-500/50 rounded-3xl overflow-hidden shadow-xl transition-all duration-300 hover:-translate-y-1.5 cursor-pointer flex flex-col"
                >
                  <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
                    <img
                      src={coverImg}
                      alt={property.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80'; }}
                    />
                    <div className="absolute top-3 left-3 flex flex-col gap-1">
                      <span className="bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-indigo-300 border border-slate-800 w-max">
                        {property.type || 'Inmueble'}
                      </span>
                      <span className="bg-slate-900/90 backdrop-blur-md px-2 py-0.5 rounded-md text-[10px] font-mono text-slate-400 border border-slate-700 w-max">
                        Ref: {property.id.substring(0, 8)}
                      </span>
                    </div>
                    <div className="absolute bottom-3 right-3 bg-indigo-600/90 text-white font-bold text-sm px-3.5 py-1 rounded-xl backdrop-blur-md shadow-lg">
                      ${price > 0 ? price.toLocaleString() : 'Consulte'} USD
                    </div>
                    <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2 text-white text-xs font-bold">
                      <Eye className="w-5 h-5 text-indigo-400" />
                      <span>Ver Ficha Completa</span>
                    </div>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div>
                      <h4 className="font-bold text-lg text-slate-100 group-hover:text-indigo-300 transition line-clamp-1">
                        {property.title || 'Propiedad Inmobiliaria'}
                      </h4>
                      <p className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="line-clamp-1">{location}</span>
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-4 border-t border-slate-800/80 text-slate-300 text-xs">
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
      <SofiaButton onClick={onOpenSofia} />

      {/* MODAL DE DETALLE EXPANDIDO */}
      <PropertyDetailModal
        property={selectedProperty}
        onClose={() => setSelectedProperty(null)}
        onOpenSofia={onOpenSofia}
      />
    </div>
  );
};
