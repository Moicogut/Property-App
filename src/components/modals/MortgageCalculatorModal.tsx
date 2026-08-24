import React, { useState, useMemo } from 'react';
import { 
  X, 
  Calculator, 
  Printer, 
  Share2, 
  Copy, 
  Check, 
  TrendingDown, 
  DollarSign, 
  Percent, 
  Calendar, 
  ShieldCheck, 
  Building2, 
  ChevronRight,
  PieChart,
  Table as TableIcon,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { Lead, Property } from '@/src/types/property';
import { 
  calculateMortgage, 
  generateWhatsAppQuoteText, 
  FinancingType, 
  MortgageCalculationResult 
} from '@/src/utils/mortgageCalculator';

interface MortgageCalculatorModalProps {
  isOpen: boolean;
  onClose: () => void;
  property?: Property | null;
  lead?: Lead | null;
}

export const MortgageCalculatorModal: React.FC<MortgageCalculatorModalProps> = ({
  isOpen,
  onClose,
  property,
  lead,
}) => {
  if (!isOpen) return null;

  // Estados base
  const initialPrice = property?.priceUsd || (lead?.budgetMaxUsd ? Number(lead.budgetMaxUsd) : 0);
  const [propertyPrice, setPropertyPrice] = useState<number>(initialPrice > 0 ? initialPrice : 75000);
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(lead?.downPaymentPercent || 20);
  const [interestRate, setInterestRate] = useState<number>(7.5);
  const [loanTermYears, setLoanTermYears] = useState<number>(20);
  const [financingType, setFinancingType] = useState<FinancingType>(
    lead?.paymentMethod === 'CREDITO_VIS' ? 'SOCIAL_HOUSING_VIS' : 'MORTGAGE_STANDARD'
  );
  const [currency, setCurrency] = useState<string>('USD');
  const [activeTab, setActiveTab] = useState<'calculator' | 'schedule' | 'summary'>('calculator');
  const [scheduleViewMode, setScheduleViewMode] = useState<'monthly' | 'annual'>('annual');
  const [copiedToast, setCopiedToast] = useState(false);

  // Preajustes rápidos según tipo de financiamiento
  const handlePresetSelect = (type: FinancingType) => {
    setFinancingType(type);
    if (type === 'SOCIAL_HOUSING_VIS') {
      setInterestRate(5.5);
      setDownPaymentPercent(10);
      setLoanTermYears(25);
    } else if (type === 'DEVELOPER_DIRECT') {
      setInterestRate(0);
      setDownPaymentPercent(30);
      setLoanTermYears(3); // 36 meses
    } else {
      setInterestRate(7.5);
      setDownPaymentPercent(20);
      setLoanTermYears(20);
    }
  };

  // Cálculo memorizado
  const calculationResult: MortgageCalculationResult = useMemo(() => {
    return calculateMortgage({
      propertyPrice,
      downPaymentPercent,
      interestRateAnnual: interestRate,
      loanTermYears,
      financingType,
      currency,
    });
  }, [propertyPrice, downPaymentPercent, interestRate, loanTermYears, financingType, currency]);

  // Manejo de copia de texto a WhatsApp
  const handleCopyWhatsApp = () => {
    const text = generateWhatsAppQuoteText(
      calculationResult,
      property?.title || 'Inmueble Seleccionado',
      lead?.fullName,
      'Property OS'
    );

    navigator.clipboard.writeText(text);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 3000);
  };

  // Envío directo a WhatsApp si existe número
  const handleDirectWhatsApp = () => {
    const text = generateWhatsAppQuoteText(
      calculationResult,
      property?.title || 'Inmueble Seleccionado',
      lead?.fullName,
      'Property OS'
    );
    const phone = lead?.phoneNumber?.replace(/\D/g, '') || '';
    const url = phone 
      ? `https://api.whatsapp.com/send?phone=${phone}&text=${encodeURIComponent(text)}`
      : `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const currencySymbol = currency === 'USD' ? '$' : currency;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-3 md:p-6 overflow-y-auto animate-in fade-in">
      <div className="bg-slate-900 text-slate-100 rounded-3xl max-w-5xl w-full border border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:bg-white print:text-slate-900 print:border-none print:shadow-none">
        
        {/* HEADER MODAL */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-950/60 print:bg-white print:border-b-2 print:border-slate-900">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg shadow-emerald-900/30">
              <Calculator className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white print:text-slate-900">
                  Cotizador Financiero & Tabla de Amortización
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 print:hidden">
                  IA PropTech Core
                </span>
              </div>
              <p className="text-xs text-slate-400 print:text-slate-600">
                {property ? `Inmueble: ${property.title} (${property.zone || property.city})` : 'Simulador financiero multipropósito'}
                {lead && ` • Cliente: ${lead.fullName}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/50 hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* TABS DE NAVEGACIÓN (Ocultos al imprimir) */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-5 pt-3 gap-2 print:hidden">
          <button
            onClick={() => setActiveTab('calculator')}
            className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
              activeTab === 'calculator'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            Simulador de Crédito
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
              activeTab === 'schedule'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <TableIcon className="w-3.5 h-3.5" />
            Tabla de Amortización ({calculationResult.totalMonths} Meses)
          </button>
          <button
            onClick={() => setActiveTab('summary')}
            className={`pb-3 px-4 text-xs font-bold transition flex items-center gap-2 border-b-2 ${
              activeTab === 'summary'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            Análisis de Calificación BANT
          </button>
        </div>

        {/* CONTENIDO PRINCIPAL SCROLLEABLE */}
        <div className="p-5 md:p-6 overflow-y-auto space-y-6 custom-scrollbar print:p-0 print:overflow-visible">
          
          {/* SECCIÓN EXCLUSIVA PARA IMPRESIÓN FORMAL (MEMBRETE EJECUTIVO) */}
          <div className="hidden print:block mb-6 border-b-2 border-slate-900 pb-4">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight">PROPERTY OS • PROPTECH SAAS</h1>
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-widest">
                  Plan de Pagos y Corrida Financiera Oficial
                </p>
              </div>
              <div className="text-right text-xs text-slate-600">
                <p><strong>Fecha de Emisión:</strong> {new Date().toLocaleDateString('es-ES')}</p>
                <p><strong>Validez:</strong> 15 días calendario</p>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-slate-100 rounded-lg text-xs grid grid-cols-3 gap-3">
              <div>
                <span className="text-slate-500 font-medium">Cliente Titular:</span>
                <p className="font-bold text-slate-900">{lead?.fullName || 'Cliente General'}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Inmueble Cotizado:</span>
                <p className="font-bold text-slate-900">{property?.title || 'Inmueble Seleccionado'}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Modalidad de Crédito:</span>
                <p className="font-bold text-slate-900">
                  {financingType === 'SOCIAL_HOUSING_VIS' ? 'Vivienda Social (VIS/ASFI)' : financingType === 'DEVELOPER_DIRECT' ? 'Financiamiento Directo Desarrollador' : 'Crédito Hipotecario Tradicional'}
                </p>
              </div>
            </div>
          </div>

          {/* TAB 1: SIMULADOR INTERACTIVO */}
          {activeTab === 'calculator' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* COLUMNA IZQUIERDA: CONTROLES & INPUTS */}
              <div className="lg:col-span-6 space-y-5">
                
                {/* Selector de Preajustes */}
                <div>
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Tipo de Financiamiento
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      onClick={() => handlePresetSelect('MORTGAGE_STANDARD')}
                      className={`p-2.5 rounded-xl border text-left transition flex flex-col ${
                        financingType === 'MORTGAGE_STANDARD'
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xs font-bold">Hipotecario</span>
                      <span className="text-[10px] text-slate-400">Bancario ~7.5%</span>
                    </button>

                    <button
                      onClick={() => handlePresetSelect('SOCIAL_HOUSING_VIS')}
                      className={`p-2.5 rounded-xl border text-left transition flex flex-col ${
                        financingType === 'SOCIAL_HOUSING_VIS'
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xs font-bold">Vivienda Social</span>
                      <span className="text-[10px] text-emerald-400">VIS/ASFI ~5.5%</span>
                    </button>

                    <button
                      onClick={() => handlePresetSelect('DEVELOPER_DIRECT')}
                      className={`p-2.5 rounded-xl border text-left transition flex flex-col ${
                        financingType === 'DEVELOPER_DIRECT'
                          ? 'bg-emerald-500/10 border-emerald-500/50 text-white'
                          : 'bg-slate-950/40 border-slate-800 text-slate-400 hover:border-slate-700'
                      }`}
                    >
                      <span className="text-xs font-bold">Directo</span>
                      <span className="text-[10px] text-teal-400">Cuotas fijas 0%</span>
                    </button>
                  </div>
                </div>

                {/* Valor del Inmueble */}
                <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-300">Valor de la Propiedad</label>
                    <div className="flex gap-1">
                      {['USD', 'BOB', 'MXN', 'COP'].map((curr) => (
                        <button
                          key={curr}
                          onClick={() => setCurrency(curr)}
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            currency === curr ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {curr}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold">
                      {currencySymbol}
                    </span>
                    <input
                      type="number"
                      value={propertyPrice}
                      onChange={(e) => setPropertyPrice(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-8 pr-4 py-2.5 font-mono text-base font-bold text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {/* Enganche / Cuota Inicial */}
                <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-300">
                      Cuota Inicial / Enganche: <span className="text-emerald-400 font-mono">{downPaymentPercent}%</span>
                    </label>
                    <span className="text-xs font-mono font-bold text-slate-400">
                      {currencySymbol}{calculationResult.downPaymentAmount.toLocaleString('es-ES')}
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0"
                    max="60"
                    step="5"
                    value={downPaymentPercent}
                    onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
                    className="w-full accent-emerald-400 cursor-pointer"
                  />

                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>0% (100% Financiado)</span>
                    <span>20% (Estándar)</span>
                    <span>50%</span>
                  </div>
                </div>

                {/* Tasa de Interés y Plazo en 2 columnas */}
                <div className="grid grid-cols-2 gap-4">
                  
                  {/* Tasa Anual */}
                  <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-300">Tasa Anual</label>
                      <span className="text-xs font-mono font-bold text-emerald-400">{interestRate}%</span>
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="30"
                      value={interestRate}
                      onChange={(e) => setInterestRate(Math.max(0, Number(e.target.value)))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 font-mono text-sm font-bold text-white focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Plazo en Años */}
                  <div className="bg-slate-950/40 border border-slate-800/80 rounded-2xl p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-xs font-bold text-slate-300">Plazo (Años)</label>
                      <span className="text-xs font-mono font-bold text-emerald-400">{loanTermYears} años</span>
                    </div>
                    <select
                      value={loanTermYears}
                      onChange={(e) => setLoanTermYears(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs font-bold text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value={1}>1 año (12 meses)</option>
                      <option value={2}>2 años (24 meses)</option>
                      <option value={3}>3 años (36 meses)</option>
                      <option value={5}>5 años (60 meses)</option>
                      <option value={10}>10 años (120 meses)</option>
                      <option value={15}>15 años (180 meses)</option>
                      <option value={20}>20 años (240 meses)</option>
                      <option value={25}>25 años (300 meses)</option>
                      <option value={30}>30 años (360 meses)</option>
                    </select>
                  </div>

                </div>

              </div>

              {/* COLUMNA DERECHA: RESULTADOS EN VIVO & TARJETA HERO */}
              <div className="lg:col-span-6 flex flex-col justify-between space-y-4">
                
                {/* Hero Card: Cuota Mensual */}
                <div className="bg-gradient-to-br from-emerald-950/60 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-3xl p-6 relative overflow-hidden shadow-xl">
                  <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                    <Sparkles className="w-32 h-32 text-emerald-400" />
                  </div>

                  <div className="relative z-10 space-y-4">
                    <span className="inline-flex items-center gap-1 text-[11px] font-extrabold uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                      <ShieldCheck className="w-3.5 h-3.5" />
                      Cuota Mensual Estimada
                    </span>

                    <div>
                      <div className="text-4xl md:text-5xl font-black font-mono text-white tracking-tight">
                        {currencySymbol}{calculationResult.monthlyTotalPayment.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Incluye amortización a capital (${calculationResult.monthlyBasePayment.toFixed(0)}) + seguros (${calculationResult.monthlyInsurance.toFixed(0)})
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800/80 text-xs">
                      <div>
                        <span className="text-slate-400">Monto del Préstamo:</span>
                        <p className="font-bold font-mono text-slate-200">
                          {currencySymbol}{calculationResult.loanAmount.toLocaleString('es-ES')}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-400">Ingreso Familiar Mínimo:</span>
                        <p className="font-bold font-mono text-emerald-400">
                          {currencySymbol}{calculationResult.requiredMonthlyIncome.toLocaleString('es-ES', { maximumFractionDigits: 0 })} / mes
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Desglose Rápido del Préstamo */}
                <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 space-y-3 text-xs">
                  <h4 className="font-bold text-slate-300 flex items-center justify-between">
                    <span>Estructura de la Operación</span>
                    <span className="text-[10px] text-slate-500 font-mono">{calculationResult.totalMonths} Cuotas</span>
                  </h4>

                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Intereses Totales Proyectados:</span>
                      <span className="font-mono font-bold text-amber-400">
                        {currencySymbol}{calculationResult.totalInterestPaid.toLocaleString('es-ES', { maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">Costo Total del Crédito (Inmueble + Intereses):</span>
                      <span className="font-mono font-bold text-slate-100">
                        {currencySymbol}{calculationResult.totalCostOfLoan.toLocaleString('es-ES', { maximumFractionDigits: 2 })}
                      </span>
                    </div>

                    {lead?.bantScore && (
                      <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between items-center text-[11px]">
                        <span className="text-slate-400">Compatibilidad Presupuesto Lead:</span>
                        <span className={`font-bold ${lead.bantScore.budget >= propertyPrice ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {lead.bantScore.budget >= propertyPrice ? '✅ 100% Calificado' : '⚠️ Requiere Ajuste de Cuota'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* BOTONES DE ACCIÓN RÁPIDA */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                  <button
                    onClick={handleCopyWhatsApp}
                    className="py-3 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition border border-slate-700 shadow-md"
                  >
                    {copiedToast ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-slate-400" />}
                    <span>{copiedToast ? '¡Copiado!' : 'Copiar para WhatsApp'}</span>
                  </button>

                  <button
                    onClick={handleDirectWhatsApp}
                    className="py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-extrabold text-xs flex items-center justify-center gap-1.5 transition shadow-lg shadow-emerald-950/40"
                  >
                    <Share2 className="w-4 h-4 text-slate-950" />
                    <span>Enviar al Cliente</span>
                  </button>

                  <button
                    onClick={handlePrint}
                    className="py-3 px-3 rounded-xl bg-slate-950 hover:bg-slate-900 text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 transition border border-slate-800 shadow-md"
                  >
                    <Printer className="w-4 h-4 text-emerald-400" />
                    <span>Imprimir PDF</span>
                  </button>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: TABLA DE AMORTIZACIÓN */}
          {activeTab === 'schedule' && (
            <div className="space-y-4">
              
              <div className="flex justify-between items-center bg-slate-950/40 p-3 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setScheduleViewMode('annual')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      scheduleViewMode === 'annual'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Resumen Anual ({calculationResult.annualSummary.length} Años)
                  </button>
                  <button
                    onClick={() => setScheduleViewMode('monthly')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                      scheduleViewMode === 'monthly'
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    Detalle Mensual Completo ({calculationResult.totalMonths} Meses)
                  </button>
                </div>

                <span className="text-xs text-slate-400 font-mono">
                  Saldo Inicial: <strong>{currencySymbol}{calculationResult.loanAmount.toLocaleString('es-ES')}</strong>
                </span>
              </div>

              <div className="border border-slate-800 rounded-2xl overflow-hidden max-h-[50vh] overflow-y-auto custom-scrollbar">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 font-bold uppercase text-[10px] tracking-wider sticky top-0 border-b border-slate-800">
                    <tr>
                      <th className="p-3">Período</th>
                      <th className="p-3">Fecha</th>
                      <th className="p-3 text-right">Cuota Total</th>
                      <th className="p-3 text-right">Abono Capital</th>
                      <th className="p-3 text-right">Intereses</th>
                      <th className="p-3 text-right">Seguros</th>
                      <th className="p-3 text-right">Saldo Insoluto</th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {scheduleViewMode === 'annual' ? (
                      calculationResult.annualSummary.map((yearRow) => (
                        <tr key={yearRow.year} className="hover:bg-slate-800/40 transition">
                          <td className="p-3 font-bold text-emerald-400">Año {yearRow.year}</td>
                          <td className="p-3 text-slate-400">12 cuotas</td>
                          <td className="p-3 text-right font-bold text-white">
                            {currencySymbol}{yearRow.totalPaid.toLocaleString('es-ES', { maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right text-emerald-400">
                            {currencySymbol}{yearRow.totalPrincipal.toLocaleString('es-ES', { maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right text-amber-400">
                            {currencySymbol}{yearRow.totalInterest.toLocaleString('es-ES', { maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right text-slate-400">
                            {currencySymbol}{yearRow.totalInsurance.toLocaleString('es-ES', { maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right font-bold text-slate-200">
                            {currencySymbol}{yearRow.endBalance.toLocaleString('es-ES', { maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    ) : (
                      calculationResult.schedule.map((row) => (
                        <tr key={row.period} className="hover:bg-slate-800/40 transition">
                          <td className="p-2.5 font-bold text-slate-300">Mes {row.period}</td>
                          <td className="p-2.5 text-slate-400">{row.paymentDate}</td>
                          <td className="p-2.5 text-right font-bold text-white">
                            {currencySymbol}{row.monthlyPayment.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-2.5 text-right text-emerald-400">
                            {currencySymbol}{row.principal.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-2.5 text-right text-amber-400">
                            {currencySymbol}{row.interest.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-2.5 text-right text-slate-400">
                            {currencySymbol}{row.insurance.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-2.5 text-right font-bold text-slate-200">
                            {currencySymbol}{row.remainingBalance.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

            </div>
          )}

          {/* TAB 3: RESUMEN Y CALIFICACIÓN BANT */}
          {activeTab === 'summary' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              
              <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  Criterios de Aprobación Bancaria (Latam)
                </h3>

                <ul className="space-y-3 text-slate-300">
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <span><strong>Ratio DTI Máximo:</strong> La cuota mensual no debe exceder el 30% al 35% del ingreso familiar líquido demostrado.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <span><strong>Edad de Cobertura:</strong> Edad actual + plazo del crédito no debe superar los 65 a 70 años al vencimiento de la última cuota.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <span><strong>Saneamiento Legal:</strong> Inmueble con Folio Real limpio, gravámenes cancelados y plano visado (Verificado por Semáforo Legal de Property OS).</span>
                  </li>
                </ul>
              </div>

              <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-5 space-y-4">
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-teal-400" />
                  Comparativa de Opciones de Financiamiento
                </h3>

                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-200">Plazo 15 Años</p>
                      <p className="text-[10px] text-slate-500">Menos intereses totales</p>
                    </div>
                    <span className="font-mono font-bold text-white">
                      {currencySymbol}{calculateMortgage({ ...calculationResult, loanTermYears: 15 }).monthlyTotalPayment.toFixed(0)}/mes
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-emerald-400">Plazo 20 Años (Actual)</p>
                      <p className="text-[10px] text-slate-400">Equilibrio cuota vs plazo</p>
                    </div>
                    <span className="font-mono font-bold text-emerald-400">
                      {currencySymbol}{calculationResult.monthlyTotalPayment.toFixed(0)}/mes
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center">
                    <div>
                      <p className="font-bold text-slate-200">Plazo 25 Años</p>
                      <p className="text-[10px] text-slate-500">Cuota más baja y accesible</p>
                    </div>
                    <span className="font-mono font-bold text-white">
                      {currencySymbol}{calculateMortgage({ ...calculationResult, loanTermYears: 25 }).monthlyTotalPayment.toFixed(0)}/mes
                    </span>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* AVISO REGULATORIO Y LEGAL ASFI */}
          <div className="mt-4 p-3 bg-amber-950/30 border border-amber-500/30 rounded-xl flex items-start gap-2.5 text-[11px] text-amber-200/90 leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p>
              <strong>Aviso Legal & Regulatorio (Bolivia):</strong> Los montos, cuotas y proformas calculadas son de carácter estrictamente informativo y referencial. Las condiciones definitivas, tasa de interés aplicable y aprobación están sujetas a la evaluación crediticia y requisitos documentales de cada entidad financiera regulada por la ASFI bajo el marco legal del Crédito de Vivienda de Interés Social (VIS) o Hipotecario Estándar.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
};
