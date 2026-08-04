import React, { useState } from "react";
import { 
  CloudUpload, 
  FileText, 
  Mic, 
  Bolt, 
  MemoryStick, 
  CheckCircle2, 
  XCircle, 
  Filter, 
  Download, 
  Edit3, 
  Ban, 
  Plus, 
  Sparkles,
  Layers,
  Search,
  Check
} from "lucide-react";
import { Property } from "@/src/types/property";

interface RagInventoryViewProps {
  properties: Property[];
  onAddProperty: (newProp: Partial<Property>) => void;
}

export const RagInventoryView: React.FC<RagInventoryViewProps> = ({
  properties,
  onAddProperty,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessingDoc, setIsProcessingDoc] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("ALL");

  // Form State for new property
  const [title, setTitle] = useState("");
  const [city, setCity] = useState("Santa Cruz");
  const [zone, setZone] = useState("");
  const [priceUsd, setPriceUsd] = useState(85000);
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(2);
  const [areaSqm, setAreaSqm] = useState(70);
  const [acceptsSocialHousing, setAcceptsSocialHousing] = useState(true);
  const [rawDescription, setRawDescription] = useState("");

  const handleSimulatedFileUpload = () => {
    setIsProcessingDoc(true);
    setTimeout(() => {
      setIsProcessingDoc(false);
      alert("✅ Documento PDF/Audio estructurado con éxito por Gemini RAG Pipeline. 512 vectores indexados en pgvector.");
    }, 1500);
  };

  const handleCreatePropertySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    onAddProperty({
      title,
      city,
      zone,
      priceUsd: Number(priceUsd),
      bedrooms: Number(bedrooms),
      bathrooms: Number(bathrooms),
      areaSqm: Number(areaSqm),
      acceptsSocialHousing,
      status: "AVAILABLE",
      rawDescription: rawDescription || `${title} ubicado en ${zone}, ${city}. Excelente oportunidad inmobiliaria.`,
      imageUrl: "https://lh3.googleusercontent.com/aida-public/AB6AXuBuKB4mqRHJLPsmjKEDw7p-COrNUcCLXZ8YQHIuRSoTNKL6L8isGXuS5J1etOj8S8i4_mle2cmdyloQCeiRjQeJiI4riUo_hXMDskWX2qnT2UABpd2bK2QE8lsm_y3M-pmEYfYA_Q5UGTe_aGYM8Aedk_VTQHS7Wb0zCvgf3Gb2VKtOtL6QdQ7kDWBxLyXLQ5NNjlucBj-XKi9PMtMQRPjBZXsTmHiV2J0beg6LhsFbwcr_c3cFutJ0yA",
      vectorIndexed: true,
      vectorDimensions: 1536,
    });

    setIsModalOpen(false);
    setTitle("");
    setZone("");
    setRawDescription("");
  };

  const filteredProperties = properties.filter((p) => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.zone.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.city.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <div className="p-6 space-y-6 bg-slate-50 min-h-full">
      
      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            Inventario RAG & Ingesta Rápida
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Gestión avanzada de activos inmobiliarios con procesamiento vectorial de IA en PostgreSQL (`pgvector`).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-2 text-xs font-bold text-slate-700">
            <MemoryStick className="w-4 h-4 text-emerald-600" />
            <span>Vectores Totales: 12,482</span>
          </div>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-all flex items-center gap-2 shadow-sm"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>+ Nueva Propiedad</span>
          </button>
        </div>
      </div>

      {/* Fast Ingestion Bento Row */}
      <div className="grid grid-cols-12 gap-6">
        
        {/* Upload Dropzone */}
        <div className="col-span-12 lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Bolt className="w-5 h-5 text-emerald-600" />
              Carga Ultrarrápida de Inmuebles
            </h3>
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full uppercase tracking-wider">
              AI Powered
            </span>
          </div>

          <div 
            onClick={handleSimulatedFileUpload}
            className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-8 flex flex-col items-center justify-center text-center space-y-3 cursor-pointer bg-slate-50/50 hover:bg-emerald-50/30 transition-all group"
          >
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CloudUpload className="w-7 h-7" />
            </div>

            <div>
              <p className="text-sm font-bold text-slate-800">
                {isProcessingDoc ? "Generando vectores RAG de alta dimensión..." : "Arrastra un dossier PDF, envía un audio de WhatsApp o pega el texto plano"}
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-lg mx-auto">
                La IA estructurará la ficha y generará los vectores de embeddings (`pgvector` 1536d) automáticamente para ser consultados por la Agente Sofía.
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button 
                type="button" 
                className="px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <FileText className="w-4 h-4 text-slate-500" />
                Adjuntar PDF / Word
              </button>
              <button 
                type="button" 
                className="px-3.5 py-2 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Mic className="w-4 h-4 text-slate-500" />
                Grabar Audio
              </button>
            </div>
          </div>
        </div>

        {/* Ingestion Metric Widget */}
        <div className="col-span-12 lg:col-span-4 bg-slate-900 text-white rounded-2xl p-6 shadow-sm flex flex-col justify-between relative overflow-hidden border border-slate-800">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">
              Eficiencia de Ingesta Vectorial
            </span>
            <div className="flex justify-between items-baseline">
              <span className="text-4xl font-extrabold text-white">0.8s</span>
              <span className="text-xs font-bold text-emerald-400">+12% vs ayer</span>
            </div>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              Tiempo promedio de estructuración y vectorización por inmueble mediante OpenAI RAG Pipeline & PostgreSQL `pgvector`.
            </p>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center text-xs">
            <span className="text-slate-400">Status del Motor RAG</span>
            <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              OPTIMIZADO
            </span>
          </div>
        </div>

      </div>

      {/* Inventory Table Section */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        
        {/* Table Filter Controls */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50/50">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por inmueble, zona o ciudad..."
              className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors">
              <Filter className="w-4 h-4" />
            </button>
            <button className="p-2 bg-white border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors">
              <Download className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-100/80 text-slate-500 text-[11px] font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Miniatura</th>
                <th className="px-6 py-3.5">Inmueble & Zona</th>
                <th className="px-6 py-3.5">Precio (USD / BOB)</th>
                <th className="px-6 py-3.5">Tipo / Sup.</th>
                <th className="px-6 py-3.5">Compatibilidad VIS / ASFI</th>
                <th className="px-6 py-3.5">Vector Status</th>
                <th className="px-6 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filteredProperties.map((prop) => (
                <tr key={prop.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="w-16 h-12 rounded-lg bg-slate-200 overflow-hidden border border-slate-300">
                      <img 
                        src={prop.imageUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBuKB4mqRHJLPsmjKEDw7p-COrNUcCLXZ8YQHIuRSoTNKL6L8isGXuS5J1etOj8S8i4_mle2cmdyloQCeiRjQeJiI4riUo_hXMDskWX2qnT2UABpd2bK2QE8lsm_y3M-pmEYfYA_Q5UGTe_aGYM8Aedk_VTQHS7Wb0zCvgf3Gb2VKtOtL6QdQ7kDWBxLyXLQ5NNjlucBj-XKi9PMtMQRPjBZXsTmHiV2J0beg6LhsFbwcr_c3cFutJ0yA'} 
                        alt={prop.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">{prop.title}</p>
                    <p className="text-xs text-slate-500">{prop.zone}, {prop.city}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-bold text-slate-900">${(prop.priceUsd ?? 0).toLocaleString()} USD</p>
                    <p className="text-xs text-slate-400">Bs. {((prop.priceUsd ?? 0) * 6.96).toLocaleString("es-BO")}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-xs font-semibold">
                      {prop.bedrooms > 0 ? `${prop.bedrooms}D / ${prop.bathrooms}B` : 'Lote'} • {prop.areaSqm}m²
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {prop.acceptsSocialHousing ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        SÍ (Vivienda Social)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold border border-rose-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                        NO (Crédito Libre)
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Indexado pgvector ({prop.vectorDimensions || 1536}d)</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="text-emerald-700 hover:underline font-bold text-xs px-2 py-1">
                        Ver Ficha
                      </button>
                      <button className="p-1.5 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-700">
                        <Edit3 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-slate-200 flex justify-between items-center text-xs text-slate-500 bg-slate-50/50">
          <span>Mostrando {filteredProperties.length} propiedades vectorizadas en PostgreSQL</span>
          <span>Status RAG: Conectado</span>
        </div>
      </div>

      {/* Modal Nueva Propiedad */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-lg font-bold text-slate-900">+ Agregar Propiedad al Inventario RAG</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePropertySubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Título de la Propiedad</label>
                <input 
                  type="text" 
                  required
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="ej. Loft Moderno Equipetrol Norte"
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ciudad</label>
                  <input 
                    type="text" 
                    value={city} 
                    onChange={(e) => setCity(e.target.value)} 
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Zona / Barrio</label>
                  <input 
                    type="text" 
                    required
                    value={zone} 
                    onChange={(e) => setZone(e.target.value)} 
                    placeholder="ej. Equipetrol"
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Precio (USD)</label>
                  <input 
                    type="number" 
                    value={priceUsd} 
                    onChange={(e) => setPriceUsd(Number(e.target.value))} 
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dormitorios</label>
                  <input 
                    type="number" 
                    value={bedrooms} 
                    onChange={(e) => setBedrooms(Number(e.target.value))} 
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Superficie (m²)</label>
                  <input 
                    type="number" 
                    value={areaSqm} 
                    onChange={(e) => setAreaSqm(Number(e.target.value))} 
                    className="w-full p-2.5 border border-slate-200 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input 
                  type="checkbox" 
                  id="visCheckbox"
                  checked={acceptsSocialHousing} 
                  onChange={(e) => setAcceptsSocialHousing(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
                <label htmlFor="visCheckbox" className="font-bold text-slate-800 text-xs cursor-pointer">
                  Acepta Crédito de Vivienda Social (VIS / ASFI)
                </label>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descripción para el Motor RAG</label>
                <textarea 
                  rows={3}
                  value={rawDescription}
                  onChange={(e) => setRawDescription(e.target.value)}
                  placeholder="Detalles clave para que la Agente Sofía responda preguntas de clientes sobre parqueo, acabados, áreas comunes..."
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 flex items-center gap-1.5 shadow-md"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Vectorizar & Guardar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
