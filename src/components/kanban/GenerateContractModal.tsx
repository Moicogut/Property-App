import React, { useState } from "react";
import { Lead, Property } from "@/src/types/property";
import { XCircle, FileText, Download, Loader2, Sparkles, CheckCircle2, Building, DollarSign } from "lucide-react";

interface GenerateContractModalProps {
  lead: Lead;
  property: Property;
  onClose: () => void;
}

export function GenerateContractModal({ lead, property, onClose }: GenerateContractModalProps) {
  const [contractType, setContractType] = useState<"RESERVATION" | "PURCHASE_PROMISE" | "CONSIGNATION">("RESERVATION");
  const [buyerName, setBuyerName] = useState(lead.fullName || "");
  const [buyerIdNumber, setBuyerIdNumber] = useState("");
  const [agreedPrice, setAgreedPrice] = useState<number>(property.priceUsd || 0);
  const [reservationAmount, setReservationAmount] = useState<number>(
    property.priceUsd ? Math.round(property.priceUsd * 0.05) : 1000
  );
  const [validUntil, setValidUntil] = useState<string>(
    new Date(Date.now() + 15 * 86400000).toISOString().split('T')[0]
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successUrl, setSuccessUrl] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccessUrl(null);

    try {
      const payload = {
        lead_id: lead.id,
        property_id: property.id,
        contract_type: contractType,
        buyer_name: buyerName,
        buyer_id_number: buyerIdNumber,
        agreed_price: agreedPrice,
        reservation_amount: reservationAmount,
        valid_until: validUntil || null
      };

      const res = await fetch("/api/contracts/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || "Ocurrió un error al generar el documento.");
      }

      if (data.success && data.pdf_url) {
        setSuccessUrl(data.pdf_url);
        // Descarga o apertura
        if (data.pdf_url.startsWith("data:")) {
          const a = document.createElement("a");
          a.href = data.pdf_url;
          a.download = `Contrato_${contractType}_${lead.fullName.replace(/\s+/g, "_")}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } else {
          window.open(data.pdf_url, "_blank");
        }
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "Error inesperado.";
      setError(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const calculatedBs = (agreedPrice * 6.96).toLocaleString("es-BO", { minimumFractionDigits: 2 });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-auto animate-in zoom-in-95">
        
        {/* Header */}
        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Emisión de Contrato Digital</h3>
              <p className="text-[11px] text-slate-500">Documento formal con validez legal y firma digital</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg">
            <XCircle className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 font-medium">
            ❌ {error}
          </div>
        )}

        {successUrl && (
          <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-xl border border-emerald-200 flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ¡Documento generado exitosamente!
            </span>
            <a
              href={successUrl}
              target="_blank"
              rel="noreferrer"
              className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg font-bold text-[10px] hover:bg-emerald-700 transition"
            >
              Abrir PDF
            </a>
          </div>
        )}

        <form onSubmit={handleGenerate} className="space-y-3.5 text-xs">
          
          {/* Tipo de Documento */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Tipo de Documento Legal</label>
            <select
              value={contractType}
              onChange={(e) => setContractType(e.target.value as any)}
              className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 font-medium text-slate-800"
            >
              <option value="RESERVATION">📄 Contrato de Reserva Formal (con Señal / Arras)</option>
              <option value="PURCHASE_PROMISE">🤝 Promesa Bilateral de Compraventa</option>
              <option value="CONSIGNATION">🏢 Contrato de Consignación & Mandato Inmobiliario</option>
            </select>
          </div>

          {/* Datos del Cliente / Comprador */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                {contractType === 'CONSIGNATION' ? 'Nombre Propietario' : 'Nombre Comprador / Interesado'}
              </label>
              <input
                type="text"
                required
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                placeholder="Nombre Completo"
                className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Documento de Identidad (CI/NIT)</label>
              <input
                type="text"
                required
                value={buyerIdNumber}
                onChange={(e) => setBuyerIdNumber(e.target.value)}
                placeholder="Ej. 7894561 SC"
                className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
          </div>

          {/* Tarjeta del Inmueble */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
            <div className="min-w-0">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Inmueble Vinculado</div>
              <div className="font-bold text-slate-900 truncate text-xs">{property.title}</div>
              <div className="text-[11px] text-slate-500">{property.zone}, {property.city} • {property.areaSqm} m²</div>
            </div>
            <div className="text-right shrink-0">
              <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                property.acceptsSocialHousing ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
              }`}>
                {property.acceptsSocialHousing ? 'Apto VIS' : 'Bancario'}
              </span>
            </div>
          </div>

          {/* Precios y Moneda */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Precio Total Acordado (USD)</label>
              <input
                type="number"
                required
                min="0"
                value={agreedPrice}
                onChange={(e) => setAgreedPrice(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-bold"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">≈ Bs. {calculatedBs}</span>
            </div>
            
            {contractType === 'RESERVATION' ? (
              <div>
                <label className="block font-bold text-slate-700 mb-1">Monto de Reserva / Arras (USD)</label>
                <input
                  type="number"
                  required
                  min="0"
                  value={reservationAmount}
                  onChange={(e) => setReservationAmount(Number(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 bg-white font-bold"
                />
                <span className="text-[10px] text-emerald-600 mt-0.5 block font-semibold">
                  ≈ {((reservationAmount / (agreedPrice || 1)) * 100).toFixed(1)}% del total
                </span>
              </div>
            ) : (
              <div>
                <label className="block font-bold text-slate-700 mb-1">Válido Hasta</label>
                <input
                  type="date"
                  required
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
              </div>
            )}
          </div>

          {contractType === 'RESERVATION' && (
            <div>
              <label className="block font-bold text-slate-700 mb-1">Plazo Límite de Reserva</label>
              <input
                type="date"
                required
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              />
            </div>
          )}

          {/* Botón de Generación */}
          <div className="pt-2 border-t border-slate-100 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-200 text-slate-600 rounded-xl font-bold hover:bg-slate-50 transition"
            >
              Cerrar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin text-emerald-400" /> : <Sparkles className="w-4 h-4 text-emerald-400" />}
              <span>{isLoading ? "Compilando PDF..." : "✨ Generar y Emitir PDF"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

