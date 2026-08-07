import React, { useState } from 'react';
import { Upload, X, Loader2 } from 'lucide-react';

interface Props {
  images: string[];
  onChange: (images: string[]) => void;
  onUploadFile: (file: File) => Promise<string | null>;
}

export const PropertyImageUploader: React.FC<Props> = ({ images, onChange, onUploadFile }) => {
  const [loadingSlots, setLoadingSlots] = useState<{ [key: number]: boolean }>({});
  const MAX_SLOTS = 6;
  const slots = Array.from({ length: MAX_SLOTS }, (_, index) => images[index] || null);

  const handleFileChange = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingSlots((prev) => ({ ...prev, [index]: true }));

    try {
      const uploadedUrl = await onUploadFile(file);
      if (uploadedUrl) {
        const newImages = [...images];
        newImages[index] = uploadedUrl;
        onChange(newImages.filter(Boolean));
      }
    } catch (error) {
      console.error('Error al subir imagen:', error);
    } finally {
      setLoadingSlots((prev) => ({ ...prev, [index]: false }));
    }
  };

  const handleRemove = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onChange(newImages);
  };

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <label className="block text-sm font-semibold text-gray-700">
          Galería del Inmueble (Máximo 6 fotografías)
        </label>
        <span className="text-xs font-medium text-gray-500">
          {images.length} / {MAX_SLOTS} cargadas
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {slots.map((url, index) => {
          const isLoading = loadingSlots[index];

          return (
            <div
              key={index}
              className={`relative aspect-video rounded-xl border-2 ${
                url ? 'border-transparent' : 'border-dashed border-gray-300 hover:border-indigo-500'
              } bg-gray-50 overflow-hidden flex flex-col items-center justify-center transition-all group`}
            >
              {isLoading ? (
                <div className="flex flex-col items-center gap-1 text-indigo-600">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span className="text-xs font-medium">Subiendo...</span>
                </div>
              ) : url ? (
                <>
                  <img
                    src={url}
                    alt={`Foto ${index + 1}`}
                    className="w-full h-full object-cover rounded-xl"
                  />
                  {index === 0 && (
                    <span className="absolute top-2 left-2 bg-indigo-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow">
                      Portada
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="absolute top-2 right-2 bg-red-600/80 hover:bg-red-600 text-white p-1.5 rounded-full backdrop-blur-sm transition opacity-0 group-hover:opacity-100"
                    title="Eliminar foto"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer p-3 text-center hover:bg-indigo-50/50 transition">
                  <div className="p-2 bg-white rounded-full shadow-sm mb-1 group-hover:scale-110 transition">
                    <Upload className="w-4 h-4 text-indigo-600" />
                  </div>
                  <span className="text-xs font-semibold text-gray-600">
                    Espacio {index + 1}
                  </span>
                  <span className="text-[10px] text-gray-400">Agregar foto</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileChange(index, e)}
                  />
                </label>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
