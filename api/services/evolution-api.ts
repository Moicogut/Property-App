/**
 * Servicio de envío de mensajes WhatsApp via Evolution API v2.
 * Responsabilidad única: enviar texto a un número vía la instancia configurada.
 */

export async function sendWhatsAppMessage(
  phone: string,
  text: string,
  instanceName: string,
  apiUrl: string,
  apiKey: string
): Promise<boolean> {
  const recipientNumber = phone
    .replace("@s.whatsapp.net", "")
    .replace("@g.us", "")
    .replace(/\D/g, "");

  try {
    console.log(`[Evolution API] Enviando mensaje a: ${recipientNumber} en instancia: ${instanceName}`);

    const rawBaseUrl = apiUrl || process.env.EVOLUTION_API_URL || "";
    const cleanBaseUrl = rawBaseUrl.trim().replace(/\/+$/, "");
    const instance = instanceName || process.env.EVOLUTION_INSTANCE_NAME || "PropertyOS-Main";
    const targetUrl = `${cleanBaseUrl}/message/sendText/${instance}`;

    const GLOBAL_API_KEY = "a2bf8aaaec21a9806766c4a536c75e716d1480feff6f9705697bf626e8fab135";
    const activeApiKey = apiKey || process.env.EVOLUTION_API_KEY || GLOBAL_API_KEY;

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: activeApiKey,
      },
      body: JSON.stringify({
        number: String(recipientNumber),
        text,
        delay: Math.floor(Math.random() * (3500 - 1500 + 1) + 1500),
        presence: "composing",
      }),
    });

    const responseText = await response.text();
    let evoData: unknown = responseText;
    try { evoData = JSON.parse(responseText); } catch { /* no-op */ }

    console.log("[Evolution API] Status:", response.status);
    if (!response.ok) console.error("[Evolution API] Error HTTP:", response.status);
    return response.ok;
  } catch (err) {
    console.error("[Evolution API] Fallo de red:", err);
    return false;
  }
}
