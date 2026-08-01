/**
 * Evolution API Client — Property OS
 * Módulo para envío de mensajes WhatsApp vía Evolution API REST.
 * Utilizado por el webhook de Sofía IA para responder automáticamente a leads.
 */

interface SendTextPayload {
  number: string; // Ej: "59171234567" (sin @s.whatsapp.net)
  text: string;
  delay?: number; // Simulación de tipeo en ms
}

interface EvolutionSendResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Envía un mensaje de texto vía WhatsApp usando la Evolution API.
 *
 * @param phone - Número de teléfono en formato internacional sin @s.whatsapp.net
 * @param text - Texto del mensaje a enviar
 * @param instanceName - Nombre de la instancia de WhatsApp en Evolution API
 * @param apiUrl - URL base de la Evolution API (ej: https://evolution.midominio.com)
 * @param apiKey - Clave de API de Evolution
 */
export async function sendWhatsAppMessage(
  phone: string,
  text: string,
  instanceName: string,
  apiUrl: string,
  apiKey: string
): Promise<EvolutionSendResponse> {
  // Limpieza del número: eliminar caracteres no numéricos excepto el + inicial
  const cleanPhone = phone.replace("@s.whatsapp.net", "").replace(/\D/g, "");

  const payload: SendTextPayload = {
    number: cleanPhone,
    text,
    delay: 1200, // Simula ~1.2s de "escribiendo..." para UX más natural
  };

  try {
    const response = await fetch(
      `${apiUrl}/message/sendText/${instanceName}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: apiKey,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        `[Evolution API] Error ${response.status} al enviar a ${cleanPhone}:`,
        errorBody
      );
      return {
        success: false,
        error: `Evolution API respondió con status ${response.status}`,
      };
    }

    const data = (await response.json()) as { key?: { id?: string } };
    console.log(
      `[Evolution API] ✅ Mensaje enviado a ${cleanPhone}. MessageId: ${data.key?.id}`
    );
    return { success: true, messageId: data.key?.id };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error desconocido";
    console.error(`[Evolution API] ❌ Fallo de red al enviar a ${cleanPhone}:`, message);
    return { success: false, error: message };
  }
}
