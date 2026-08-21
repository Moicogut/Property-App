/**
 * Utilidad de Generación de Eventos y Enlaces de Calendario para Property OS.
 * Soporta Google Calendar, Outlook Web, Apple Calendar / Archivos .ICS y WhatsApp.
 */

export interface CalendarEventData {
  title: string;
  description: string;
  location: string;
  startDate: Date | string;
  durationMinutes?: number; // Por defecto 45 minutos para visitas inmobiliarias
  clientName?: string;
  clientPhone?: string;
  propertyTitle?: string;
}

/**
 * Convierte una fecha a formato ISO UTC limpio para URLs de Google Calendar (YYYYMMDDTHHmmssZ).
 */
export function formatToGoogleCalendarDate(date: Date): string {
  return date.toISOString().replace(/-|:|\.\d+/g, "");
}

/**
 * Genera el enlace directo a Google Calendar (funciona en móvil y escritorio).
 */
export function generateGoogleCalendarUrl(event: CalendarEventData): string {
  const start = new Date(event.startDate);
  const end = new Date(start.getTime() + (event.durationMinutes || 45) * 60000);

  const datesParam = `${formatToGoogleCalendarDate(start)}/${formatToGoogleCalendarDate(end)}`;

  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    details: event.description,
    location: event.location,
    dates: datesParam,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Genera el enlace directo para Outlook / Office 365 Web.
 */
export function generateOutlookCalendarUrl(event: CalendarEventData): string {
  const start = new Date(event.startDate);
  const end = new Date(start.getTime() + (event.durationMinutes || 45) * 60000);

  const params = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    subject: event.title,
    body: event.description,
    location: event.location,
    startdt: start.toISOString(),
    enddt: end.toISOString(),
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Genera el contenido de un archivo estándar .ICS (iCalendar) para Apple Calendar, Outlook Desktop y Android.
 */
export function generateIcsFileContent(event: CalendarEventData): string {
  const start = new Date(event.startDate);
  const end = new Date(start.getTime() + (event.durationMinutes || 45) * 60000);
  const now = new Date();

  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const formatDateToIcs = (d: Date) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

  const uid = `property-os-${Date.now()}@propertyapp.io`;

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Property OS//PropTech Calendar System//ES",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${formatDateToIcs(now)}`,
    `DTSTART:${formatDateToIcs(start)}`,
    `DTEND:${formatDateToIcs(end)}`,
    `SUMMARY:${event.title.replace(/,/g, "\\,").replace(/;/g, "\\;")}`,
    `DESCRIPTION:${event.description.replace(/\n/g, "\\n").replace(/,/g, "\\,").replace(/;/g, "\\;")}`,
    `LOCATION:${event.location.replace(/,/g, "\\,").replace(/;/g, "\\;")}`,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-PT2H",
    "ACTION:DISPLAY",
    "DESCRIPTION:Recordatorio de Visita Inmobiliaria",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}

/**
 * Descarga en el navegador el archivo .ics para el usuario en 1 clic.
 */
export function downloadIcsFile(event: CalendarEventData, filename = "visita-inmueble.ics"): void {
  const content = generateIcsFileContent(event);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Genera el copy de confirmación de cita para WhatsApp incluyendo el enlace a Google Calendar.
 */
export function generateAppointmentWhatsAppMessage(
  event: CalendarEventData,
  agencyName = "Property OS"
): string {
  const start = new Date(event.startDate);
  const dateFormatted = start.toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const timeFormatted = start.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const googleCalUrl = generateGoogleCalendarUrl(event);

  return `¡Hola *${event.clientName || "Estimado cliente"}*! 👋

✅ Tu visita para *${event.propertyTitle || "el inmueble"}* ha sido confirmada con éxito.

📅 *Fecha:* ${dateFormatted}
⏰ *Hora:* ${timeFormatted}
📍 *Lugar:* ${event.location}

📲 *Agrega la cita a tu Google Calendar en 1 clic:*
${googleCalUrl}

Un asesor te esperará puntualmente en el lugar. Si requieres reprogramar o indicaciones adicionales, ¡avísanos por este chat! 🏢`;
}
