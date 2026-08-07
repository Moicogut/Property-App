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
  Check,
  Trash2,
  PauseCircle,
  Eye,
  PlayCircle
} from "lucide-react";
import { Property } from "@/src/types/property";
import { CopyManagementSection } from "./CopyManagementSection";
import { PropertyImageUploader } from "@/src/components/PropertyImageUploader";
import { supabase } from "@/src/lib/supabase";

interface RagInventoryViewProps {
  properties: Property[];
  onAddProperty: (newProp: Partial<Property>) => void;
  onUpdateProperty?: (id: string, updates: Partial<Property>) => void;
  onDeleteProperty?: (id: string) => void;
}

export const RagInventoryView: React.FC<RagInventoryViewProps> = ({
  properties,
  onAddProperty,
  onUpdateProperty,
  onDeleteProperty,
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessingDoc, setIsProcessingDoc] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>("ALL");
  
  // States for new management features
  const [viewingProperty, setViewingProperty] = useState<Property | null>(null);
  const [editingProperty, setEditingProperty] = useState<Property | null>(null);
  const [generatedCopy, setGeneratedCopy] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);
  const [loadingCopy, setLoadingCopy] = useState<boolean>(false);

  const handleUploadFile = async (file: File): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const filePath = `properties/${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('images')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Error subiendo imagen:', uploadError);
      return null;
    }

    const { data } = supabase.storage.from('images').getPublicUrl(filePath);
    return data.publicUrl;
  };

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
  const [imageUrls, setImageUrls] = useState("");

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

    const parsedUrls = imageUrls.split(/[\n,]+/).map(u => u.trim()).filter(Boolean);
    if (parsedUrls.length < 2 || parsedUrls.length > 6) {
      alert("Por favor ingresa entre 2 y 6 enlaces de imágenes válidos.");
      return;
    }

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
      imageUrl: parsedUrls.join(","),
      vectorIndexed: true,
      vectorDimensions: 1536,
    });

    setIsModalOpen(false);
    setTitle("");
    setZone("");
    setRawDescription("");
    setImageUrls("");
  };

  const filteredProperties = properties.filter((p) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch = (p.title || "").toLowerCase().includes(q) || 
                          (p.zone || "").toLowerCase().includes(q) ||
                          (p.city || "").toLowerCase().includes(q);
    return matchesSearch;
  });

  return (
    <div className="p-6 space-y-6 bg-slate-50 h-full overflow-y-auto">
      
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
                <th className="hidden md:table-cell px-3 md:px-6 py-3.5">Miniatura</th>
                <th className="px-3 md:px-6 py-3.5">Inmueble & Zona</th>
                <th className="px-3 md:px-6 py-3.5">Precio</th>
                <th className="hidden sm:table-cell px-3 md:px-6 py-3.5">Tipo / Sup.</th>
                <th className="hidden lg:table-cell px-3 md:px-6 py-3.5">Compat. VIS</th>
                <th className="hidden xl:table-cell px-3 md:px-6 py-3.5">Vector Status</th>
                <th className="px-3 md:px-6 py-3.5 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-sm">
              {filteredProperties.map((prop) => (
                <tr key={prop.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="hidden md:table-cell px-3 md:px-6 py-4">
                    <div className="w-16 h-12 rounded-lg bg-slate-200 overflow-hidden border border-slate-300">
                      <img 
                        src={(prop.imageUrl || "").split(',')[0]?.trim() || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBuKB4mqRHJLPsmjKEDw7p-COrNUcCLXZ8YQHIuRSoTNKL6L8isGXuS5J1etOj8S8i4_mle2cmdyloQCeiRjQeJiI4riUo_hXMDskWX2qnT2UABpd2bK2QE8lsm_y3M-pmEYfYA_Q5UGTe_aGYM8Aedk_VTQHS7Wb0zCvgf3Gb2VKtOtL6QdQ7kDWBxLyXLQ5NNjlucBj-XKi9PMtMQRPjBZXsTmHiV2J0beg6LhsFbwcr_c3cFutJ0yA'} 
                        alt={prop.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </td>
                  <td className="px-3 md:px-6 py-4">
                    <p className="font-bold text-slate-900 text-xs md:text-sm">{prop.title}</p>
                    <p className="text-[10px] md:text-xs text-slate-500">{prop.zone}, {prop.city}</p>
                  </td>
                  <td className="px-3 md:px-6 py-4">
                    <p className="font-bold text-slate-900 text-xs md:text-sm">${(prop.priceUsd ?? 0).toLocaleString()} USD</p>
                    <p className="text-[10px] md:text-xs text-slate-400">Bs. {((prop.priceUsd ?? 0) * 6.96).toLocaleString("es-BO")}</p>
                  </td>
                  <td className="hidden sm:table-cell px-3 md:px-6 py-4">
                    <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-md text-[10px] md:text-xs font-semibold whitespace-nowrap">
                      {prop.bedrooms > 0 ? `${prop.bedrooms}D / ${prop.bathrooms}B` : 'Lote'} • {prop.areaSqm}m²
                    </span>
                  </td>
                  <td className="hidden lg:table-cell px-3 md:px-6 py-4">
                    {prop.acceptsSocialHousing ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] md:text-xs font-bold border border-emerald-200 whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        SÍ (VIS)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-500 text-[10px] md:text-xs font-bold border border-slate-200 whitespace-nowrap">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                        NO (Libre)
                      </span>
                    )}
                  </td>
                  <td className="hidden xl:table-cell px-3 md:px-6 py-4">
                    <div className="flex items-center gap-1.5 text-[10px] md:text-xs text-emerald-600 font-semibold bg-emerald-50/50 px-2 py-1 rounded-md border border-emerald-100 whitespace-nowrap">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Indexado pgvector (1536d)
                    </div>
                  </td>
                  <td className="px-3 md:px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button 
                        onClick={() => setViewingProperty(prop)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 transition-colors"
                        title="Ver Ficha"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setEditingProperty(prop)}
                        className="p-1.5 bg-blue-50 hover:bg-blue-100 rounded text-blue-600 transition-colors"
                        title="Editar Propiedad"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => onUpdateProperty && onUpdateProperty(prop.id, { status: prop.status === "AVAILABLE" ? "RESERVED" : "AVAILABLE" })}
                        className={`p-1.5 ${prop.status === "RESERVED" ? "bg-amber-100 text-amber-700 hover:bg-amber-200" : "bg-slate-50 text-slate-400 hover:bg-slate-200"} rounded transition-colors`}
                        title={prop.status === "RESERVED" ? "Reanudar" : "Pausar/Reservar"}
                      >
                        {prop.status === "RESERVED" ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
                      </button>
                      <button 
                        onClick={() => {
                          if (window.confirm("¿Estás seguro de eliminar esta propiedad y todos sus vectores RAG?")) {
                            onDeleteProperty && onDeleteProperty(prop.id);
                          }
                        }}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 rounded text-rose-600 transition-colors"
                        title="Borrar Propiedad"
                      >
                        <Trash2 className="w-4 h-4" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-2 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 max-h-[95vh] overflow-y-auto custom-scrollbar">
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

              <div>
                <label className="block font-bold text-slate-700 mb-1">Enlaces de Imágenes (Mín 2, Máx 6)</label>
                <textarea 
                  required
                  rows={3}
                  value={imageUrls}
                  onChange={(e) => setImageUrls(e.target.value)}
                  placeholder="https://ejemplo.com/foto1.jpg&#10;https://ejemplo.com/foto2.jpg"
                  className="w-full p-2.5 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 text-xs resize-none"
                />
                <p className="text-[10px] text-slate-500 mt-1">Ingresa un enlace por línea.</p>
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

      {/* Modal Ver Ficha de Propiedad */}
      {viewingProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-2 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 max-h-[95vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900">{viewingProperty.title}</h3>
                <p className="text-xs text-slate-500">{viewingProperty.zone}, {viewingProperty.city}</p>
              </div>
              <button onClick={() => setViewingProperty(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex gap-2 w-full h-48 overflow-x-auto custom-scrollbar snap-x snap-mandatory mb-4">
              {(viewingProperty.imageUrl || "").split(',').filter(Boolean).map((imgUrl, i) => (
                <div key={i} className="min-w-[100%] h-full bg-slate-100 rounded-xl overflow-hidden border border-slate-200 snap-center">
                  <img src={imgUrl.trim()} className="w-full h-full object-cover" alt={`Property ${i+1}`} />
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Precio Venta</div>
                <div className="text-base font-extrabold text-emerald-600">${(viewingProperty.priceUsd ?? 0).toLocaleString()} USD</div>
              </div>
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-[10px] text-slate-500 font-bold uppercase">Superficie</div>
                <div className="text-base font-bold text-slate-700">{viewingProperty.areaSqm} m²</div>
              </div>
            </div>
            
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 mb-4 text-xs">
              <span className="font-bold text-slate-700 block mb-1">Características:</span>
              <span>🛏️ {viewingProperty.bedrooms} Habitaciones • 🚿 {viewingProperty.bathrooms} Baños</span>
              <div className="mt-2 text-slate-600 max-h-24 overflow-y-auto custom-scrollbar italic">
                {viewingProperty.rawDescription}
              </div>
            </div>

            {/* Auditoría Legal & Marketing */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 mb-4 text-xs">
              <span className="font-bold text-slate-700 block mb-2">Auditoría Legal (DDRR / Municipal)</span>
              <div className="grid grid-cols-2 gap-2 mb-3">
                <div className="flex justify-between items-center bg-white p-2 border border-slate-200 rounded">
                  <span className="text-slate-500">Folio Real</span>
                  <span className="font-bold text-slate-700">PENDIENTE</span>
                </div>
                <div className="flex justify-between items-center bg-white p-2 border border-slate-200 rounded">
                  <span className="text-slate-500">Impuestos</span>
                  <span className="font-bold text-slate-700">PENDIENTE</span>
                </div>
                <div className="flex justify-between items-center bg-white p-2 border border-slate-200 rounded">
                  <span className="text-slate-500">Catastro</span>
                  <span className="font-bold text-slate-700">PENDIENTE</span>
                </div>
                <div className="flex justify-between items-center bg-white p-2 border border-slate-200 rounded">
                  <span className="text-slate-500">Semáforo</span>
                  <span className="font-bold text-emerald-600">VERDE</span>
                </div>
              </div>
              <CopyManagementSection property={viewingProperty} />
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar Propiedad */}
      {editingProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-2 sm:p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl space-y-4 animate-in zoom-in-95 max-h-[95vh] overflow-y-auto custom-scrollbar">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3 mb-4">
              <h3 className="text-lg font-bold text-slate-900">Editar Propiedad</h3>
              <button onClick={() => setEditingProperty(null)} className="text-slate-400 hover:text-slate-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const imagesArray = editingProperty.images || (editingProperty.imageUrl ? [editingProperty.imageUrl] : []);
              if (imagesArray.length === 0) {
                alert("Por favor ingresa al menos una imagen de la propiedad.");
                return;
              }
              
              if (onUpdateProperty) {
                const coverUrl = imagesArray.find((img) => typeof img === 'string' && img.startsWith('http')) || imagesArray[0] || '';
                onUpdateProperty(editingProperty.id, { 
                  ...editingProperty, 
                  imageUrl: coverUrl, // URL de la primera imagen como portada
                  images: imagesArray 
                });
              }
              setEditingProperty(null);
            }} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Título</label>
                <input type="text" required value={editingProperty.title} onChange={(e) => setEditingProperty({...editingProperty, title: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" />
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Precio USD</label>
                  <input type="number" required min="0" value={editingProperty.priceUsd} onChange={(e) => setEditingProperty({...editingProperty, priceUsd: Number(e.target.value)})} className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Área (m²)</label>
                  <input type="number" required min="0" value={editingProperty.areaSqm} onChange={(e) => setEditingProperty({...editingProperty, areaSqm: Number(e.target.value)})} className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Dormitorios</label>
                  <input type="number" required min="0" value={editingProperty.bedrooms} onChange={(e) => setEditingProperty({...editingProperty, bedrooms: Number(e.target.value)})} className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Baños</label>
                  <input type="number" required min="0" value={editingProperty.bathrooms} onChange={(e) => setEditingProperty({...editingProperty, bathrooms: Number(e.target.value)})} className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50" />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descripción RAG (Contexto IA)</label>
                <textarea required rows={3} value={editingProperty.rawDescription} onChange={(e) => setEditingProperty({...editingProperty, rawDescription: e.target.value})} className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 resize-none"></textarea>
              </div>

              <div>
                <PropertyImageUploader
                  images={editingProperty.images || (editingProperty.imageUrl ? editingProperty.imageUrl.split(/[\n,]+/).map(u => u.trim()).filter(Boolean) : [])}
                  onChange={(newImages) => setEditingProperty({...editingProperty, images: newImages, imageUrl: newImages[0] || ''})}
                  onUploadFile={handleUploadFile}
                />
              </div>

              <div className="pt-2">
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
