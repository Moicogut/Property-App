/**
 * Utilidades de Fecha y Tiempo con Huso Horario Oficial de Bolivia (America/La_Paz, GMT-4).
 * Previene defectos de fechas históricas y desfases de agendamiento (IA-03).
 */

export const BOLIVIA_TIMEZONE = "America/La_Paz";

/**
 * Obtiene la fecha y hora actual en Bolivia en formato estructurado.
 */
export function getBoliviaCurrentDateTime(): {
  isoString: string;
  formattedDate: string;
  formattedTime: string;
  dayOfWeek: string;
  year: number;
  month: number;
  day: number;
} {
  const now = new Date();

  const formatterDate = new Intl.DateTimeFormat("es-BO", {
    timeZone: BOLIVIA_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  const formatterTime = new Intl.DateTimeFormat("es-BO", {
    timeZone: BOLIVIA_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  const formatterWeekday = new Intl.DateTimeFormat("es-BO", {
    timeZone: BOLIVIA_TIMEZONE,
    weekday: "long",
  });

  const formattedDate = formatterDate.format(now);
  const formattedTime = formatterTime.format(now);
  const dayOfWeek = formatterWeekday.format(now);

  const parts = formatterDate.formatToParts(now);
  const year = parseInt(parts.find((p) => p.type === "year")?.value || "2026", 10);
  const month = parseInt(parts.find((p) => p.type === "month")?.value || "1", 10);
  const day = parseInt(parts.find((p) => p.type === "day")?.value || "1", 10);

  return {
    isoString: now.toISOString(),
    formattedDate,
    formattedTime,
    dayOfWeek,
    year,
    month,
    day,
  };
}

/**
 * Valida si una fecha objetivo es futura y admisible para agendamiento de visitas.
 * Rechaza fechas en el pasado (IA-03).
 */
export function validateFutureAppointmentDate(targetDate: Date | string): {
  isValid: boolean;
  isPast: boolean;
  errorMessage?: string;
  parsedDate?: Date;
} {
  const target = typeof targetDate === "string" ? new Date(targetDate) : targetDate;
  if (isNaN(target.getTime())) {
    return { isValid: false, isPast: false, errorMessage: "Fecha u hora inválida." };
  }

  const now = new Date();
  if (target.getTime() < now.getTime()) {
    return {
      isValid: false,
      isPast: true,
      errorMessage: "No se pueden agendar visitas en fechas u horarios pasados.",
    };
  }

  // Máximo 60 días en el futuro para una visita
  const maxFuture = new Date();
  maxFuture.setDate(maxFuture.getDate() + 60);
  if (target.getTime() > maxFuture.getTime()) {
    return {
      isValid: false,
      isPast: false,
      errorMessage: "La fecha solicitada excede el horizonte máximo de agendamiento (60 días).",
    };
  }

  return { isValid: true, isPast: false, parsedDate: target };
}
