import React, { useState } from 'react';
import { Building2, Search, LogIn, MapPin, Bed, Bath, Maximize, Sparkles } from 'lucide-react';

interface Property {
  id: string;
  title: string;
  price: number;
  location: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  image_url: string;
  images?: string[];
  type: string;
}

interface Props {
  properties: Property[];
  onLoginClick: () => void;
  onSelectProperty: (property: Property) => void;
}

export const LandingPage: React.FC<Props> = ({ properties, onLoginClick, onSelectProperty }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filteredProperties = properties.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || p.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
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

        <button
          onClick={onLoginClick}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-medium text-sm rounded-xl shadow-lg shadow-indigo-500/25 transition hover:scale-[1.02] active:scale-[0.98]"
        >
          <LogIn className="w-4 h-4" />
          <span>Acceso Usuarios / Admin</span>
        </button>
      </nav>

      <header className="relative pt-16 pb-20 px-6 max-w-7xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Propiedades Seleccionadas & Gestión Inteligente</span>
        </div>

        <h2 className="text-4xl md:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
          Encuentra tu próximo espacio exclusivo con facilidad
        </h2>
        <p className="mt-4 text-slate-400 text-base md:text-lg max-w-2xl mx-auto">
          Explora nuestro portafolio actualizado en tiempo real. Calidad, ubicación y diseño arquitectónico superior.
        </p>

        <div className="mt-10 max-w-3xl mx-auto bg-slate-900/90 border border-slate-800 p-3 rounded-2xl shadow-2xl flex flex-col md:flex-row gap-3">
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

      <main className="max-w-7xl mx-auto px-6 pb-24">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h3 className="text-2xl font-bold text-white">Inmuebles Disponibles</h3>
            <p className="text-slate-400 text-sm">
              Mostrando {filteredProperties.length} propiedades en catálogo
            </p>
          </div>
        </div>

        {filteredProperties.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/50 rounded-3xl border border-slate-800">
            <p className="text-slate-400">No se encontraron propiedades con esos criterios.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProperties.map((property) => (
              <div
                key={property.id}
                onClick={() => onSelectProperty(property)}
                className="group bg-slate-900/70 border border-slate-800 hover:border-indigo-500/50 rounded-3xl overflow-hidden shadow-xl transition-all duration-300 hover:-translate-y-1.5 cursor-pointer flex flex-col"
              >
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
                  <img
                    src={property.image_url || property.images?.[0] || 'https://via.placeholder.com/600x400'}
                    alt={property.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-indigo-300 border border-slate-800">
                    {property.type || 'Inmueble'}
                  </div>
                  <div className="absolute bottom-3 right-3 bg-indigo-600/90 text-white font-bold text-sm px-3.5 py-1 rounded-xl backdrop-blur-md shadow-lg">
                    ${property.price?.toLocaleString()} USD
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <h4 className="font-bold text-lg text-slate-100 group-hover:text-indigo-300 transition">
                      {property.title}
                    </h4>
                    <p className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                      <span>{property.location}</span>
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
                      <span>{property.area || 0} m²</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};
