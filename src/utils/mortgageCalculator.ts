/**
 * Utilidad de Cálculo Financiero y Tablas de Amortización Inmobiliaria para Property OS.
 * Soporta Crédito Hipotecario Tradicional, Vivienda Social (VIS/ASFI/Subsidios) y Financiamiento Directo.
 */

export type FinancingType = 'MORTGAGE_STANDARD' | 'SOCIAL_HOUSING_VIS' | 'DEVELOPER_DIRECT';

export interface AmortizationRow {
  period: number;
  paymentDate: string;
  monthlyPayment: number;
  principal: number;
  interest: number;
  insurance: number;
  remainingBalance: number;
  cumulativeInterest: number;
  cumulativePrincipal: number;
}

export interface AmortizationAnnualSummary {
  year: number;
  totalPaid: number;
  totalPrincipal: number;
  totalInterest: number;
  totalInsurance: number;
  endBalance: number;
}

export interface MortgageCalculationInput {
  propertyPrice: number;
  downPaymentPercent: number; // Ej. 20 (para 20%)
  interestRateAnnual: number; // Ej. 7.5 (para 7.5%)
  loanTermYears: number; // Ej. 20 (años)
  financingType?: FinancingType;
  insuranceRateAnnual?: number; // Seguro de desgravamen e incendio (ej. 0.05% mensual o 0.6% anual)
  currency?: string; // USD, BOB, MXN, COP, etc.
  startDate?: Date;
}

export interface MortgageCalculationResult {
  propertyPrice: number;
  downPaymentAmount: number;
  downPaymentPercent: number;
  loanAmount: number;
  interestRateAnnual: number;
  monthlyInterestRate: number;
  loanTermYears: number;
  totalMonths: number;
  monthlyBasePayment: number;
  monthlyInsurance: number;
  monthlyTotalPayment: number;
  totalInterestPaid: number;
  totalCostOfLoan: number;
  requiredMonthlyIncome: number; // Estimado al 30% de DTI
  financingType: FinancingType;
  currency: string;
  schedule: AmortizationRow[];
  annualSummary: AmortizationAnnualSummary[];
}

/**
 * Calcula la corrida financiera completa con tabla de amortización por el sistema francés (cuota fija).
 */
export function calculateMortgage(input: MortgageCalculationInput): MortgageCalculationResult {
  const {
    propertyPrice = 0,
    downPaymentPercent = 20,
    interestRateAnnual = 7.5,
    loanTermYears = 20,
    financingType = 'MORTGAGE_STANDARD',
    insuranceRateAnnual = 0.6, // 0.6% anual típico combinado
    currency = 'USD',
    startDate = new Date(),
  } = input;

  const validPrice = Math.max(0, propertyPrice);
  const validDownPercent = Math.min(100, Math.max(0, downPaymentPercent));
  const downPaymentAmount = (validPrice * validDownPercent) / 100;
  const loanAmount = Math.max(0, validPrice - downPaymentAmount);

  const totalMonths = Math.max(1, Math.round(loanTermYears * 12));
  const monthlyInterestRate = (interestRateAnnual / 100) / 12;
  const monthlyInsuranceRate = (insuranceRateAnnual / 100) / 12;

  let monthlyBasePayment = 0;

  if (loanAmount <= 0) {
    monthlyBasePayment = 0;
  } else if (monthlyInterestRate === 0) {
    // Tasa 0% (ej. financiamiento directo sin intereses)
    monthlyBasePayment = loanAmount / totalMonths;
  } else {
    // Fórmula Sistema Francés: PMT = P * [ r * (1 + r)^n ] / [ (1 + r)^n - 1 ]
    const numerator = monthlyInterestRate * Math.pow(1 + monthlyInterestRate, totalMonths);
    const denominator = Math.pow(1 + monthlyInterestRate, totalMonths) - 1;
    monthlyBasePayment = loanAmount * (numerator / denominator);
  }

  // Seguro mensual promedio sobre saldo o monto inicial
  const monthlyInsurance = (loanAmount * monthlyInsuranceRate);
  const monthlyTotalPayment = monthlyBasePayment + monthlyInsurance;

  // Generación de la tabla de amortización período por período
  const schedule: AmortizationRow[] = [];
  let remainingBalance = loanAmount;
  let cumulativeInterest = 0;
  let cumulativePrincipal = 0;

  const currentDate = new Date(startDate);

  for (let month = 1; month <= totalMonths; month++) {
    currentDate.setMonth(currentDate.getMonth() + 1);

    const interestForMonth = remainingBalance * monthlyInterestRate;
    let principalForMonth = monthlyBasePayment - interestForMonth;

    // En el último mes se ajusta para evitar desfases por redondeo
    if (month === totalMonths || principalForMonth > remainingBalance) {
      principalForMonth = remainingBalance;
    }

    remainingBalance = Math.max(0, remainingBalance - principalForMonth);
    cumulativeInterest += interestForMonth;
    cumulativePrincipal += principalForMonth;

    const rowDateFormatted = currentDate.toLocaleDateString('es-ES', {
      month: 'short',
      year: 'numeric',
    });

    schedule.push({
      period: month,
      paymentDate: rowDateFormatted,
      monthlyPayment: principalForMonth + interestForMonth + monthlyInsurance,
      principal: principalForMonth,
      interest: interestForMonth,
      insurance: monthlyInsurance,
      remainingBalance,
      cumulativeInterest,
      cumulativePrincipal,
    });

    if (remainingBalance <= 0) break;
  }

  // Resumen anual
  const annualSummary: AmortizationAnnualSummary[] = [];
  let currentYear = 1;
  let yearPaid = 0;
  let yearPrincipal = 0;
  let yearInterest = 0;
  let yearInsurance = 0;

  schedule.forEach((row, index) => {
    yearPaid += row.monthlyPayment;
    yearPrincipal += row.principal;
    yearInterest += row.interest;
    yearInsurance += row.insurance;

    const isYearEnd = (index + 1) % 12 === 0 || index === schedule.length - 1;
    if (isYearEnd) {
      annualSummary.push({
        year: currentYear,
        totalPaid: yearPaid,
        totalPrincipal: yearPrincipal,
        totalInterest: yearInterest,
        totalInsurance: yearInsurance,
        endBalance: row.remainingBalance,
      });
      currentYear++;
      yearPaid = 0;
      yearPrincipal = 0;
      yearInterest = 0;
      yearInsurance = 0;
    }
  });

  const totalInterestPaid = cumulativeInterest;
  const totalCostOfLoan = downPaymentAmount + loanAmount + totalInterestPaid + (monthlyInsurance * totalMonths);
  const requiredMonthlyIncome = monthlyTotalPayment / 0.30; // DTI 30%

  return {
    propertyPrice: validPrice,
    downPaymentAmount,
    downPaymentPercent: validDownPercent,
    loanAmount,
    interestRateAnnual,
    monthlyInterestRate,
    loanTermYears,
    totalMonths,
    monthlyBasePayment,
    monthlyInsurance,
    monthlyTotalPayment,
    totalInterestPaid,
    totalCostOfLoan,
    requiredMonthlyIncome,
    financingType,
    currency,
    schedule,
    annualSummary,
  };
}

/**
 * Genera un texto comercial formateado listo para enviar por WhatsApp al prospecto.
 */
export function generateWhatsAppQuoteText(
  result: MortgageCalculationResult,
  propertyTitle: string,
  clientName?: string,
  agencyName: string = 'Property OS'
): string {
  const greeting = clientName ? `¡Hola *${clientName}*!` : '¡Hola!';
  const currencySymbol = result.currency === 'USD' ? '$' : result.currency;

  return `${greeting} Te comparto la simulación financiera oficial para *${propertyTitle}*:

🏢 *VALOR DEL INMUEBLE:* ${currencySymbol}${result.propertyPrice.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
💵 *Cuota Inicial (${result.downPaymentPercent}%):* ${currencySymbol}${result.downPaymentAmount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
🏦 *Monto Financiado:* ${currencySymbol}${result.loanAmount.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
📅 *Plazo:* ${result.loanTermYears} años (${result.totalMonths} meses)
📈 *Tasa Anual:* ${result.interestRateAnnual}%

✨ *CUOTA MENSUAL ESTIMADA:*
👉 *${currencySymbol}${result.monthlyTotalPayment.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} / mes*
_(Incluye capital + intereses + seguros aproximados)_

💼 *Ingreso familiar sugerido:* ${currencySymbol}${result.requiredMonthlyIncome.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 })} / mes.

¿Te gustaría que agendemos una visita para conocer el inmueble y revisar la aprobación bancaria? 📲`;
}
