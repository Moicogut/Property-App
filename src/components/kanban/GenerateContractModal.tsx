import React, { useState } from "react";
import { Lead, Property } from "@/src/types/property";
import { XCircle, FileText, Download, Loader2 } from "lucide-react";

interface GenerateContractModalProps {
  lead: Lead;
  property: Property;
  onClose: () => void;
}

export function GenerateContractModal({ lead, property, onClose }: GenerateContractModalProps) {
  const [contractType, setContractType] = useState<"RESERVATION" | "PURCHASE_PROMISE">("RESERVATION");
  const [buyerName, setBuyerName] = useState(lead.fullName || "");
  const [buyerIdNumber, setBuyerIdNumber] = useState("");
  const [agreedPrice, setAgreedPrice] = useState<number>(property.priceUsd || 0);
  const [reservationAmount, setReservationAmount] = useState<number>(0);
  const [validUntil, setValidUntil] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

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
        window.open(data.pdf_url, "_blank");
        onClose();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95">
        <div className="flex justify-between items-center border-b border-slate-200 pb-4 mb-4">
          <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600" />
            Emitir Documento Formal
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <XCircle className="w-6 h-6" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleGenerate} className="space-y-4 text-sm">
          <div>
            <label className="block font-bold text-slate-700 mb-1 text-xs">Tipo de Documento</label>
            <select
              value={contractType}
              onChange={(e) => setContractType(e.target.value as any)}
              className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50"
            >
              <option value="RESERVATION">Contrato de Reserva Formal</option>
              <option value="PURCHASE_PROMISE">Promesa de Compraventa</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-xs">Nombre Comprador</label>
              <input
                type="text"
                required
                value={buyerName}
                onChange={(e) => setBuyerName(e.target.value)}
                className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-xs">CI / NIT</label>
              <input
                type="text"
                required
                value={buyerIdNumber}
                onChange={(e) => setBuyerIdNumber(e.target.value)}
                placeholder="Ej. 1234567 SC"
                className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
            <p className="text-xs font-bold text-slate-500 mb-1">Inmueble de Interés:</p>
            <p className="font-bold text-slate-800">{property.title}</p>
            <p className="text-xs text-slate-500">{property.zone}, {property.city}</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-xs">Precio Acordado (USD)</label>
              <input
                type="number"
                required
                min="0"
                value={agreedPrice}
                onChange={(e) => setAgreedPrice(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1 text-xs">Monto Reserva (USD)</label>
              <input
                type="number"
                required
                min="0"
                value={reservationAmount}
                onChange={(e) => setReservationAmount(Number(e.target.value))}
                className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1 text-xs">Válido Hasta</label>
            <input
              type="date"
              required
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="w-full border border-slate-200 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-70"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
              <span>{isLoading ? "Generando PDF..." : "✨ Generar y Descargar PDF"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
