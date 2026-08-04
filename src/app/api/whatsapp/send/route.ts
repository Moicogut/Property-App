import { NextResponse } from "next/server";
import { supabaseServer } from "@/src/lib/supabase-server";
import { sendWhatsAppMessage } from "@/src/lib/evolution";

export async function POST(req: Request) {
  try {
    const { leadId, text } = await req.json();

    if (!leadId || !text) {
      return NextResponse.json({ error: "Faltan datos obligatorios (leadId, text)" }, { status: 400 });
    }

    // 1. Obtener los datos del lead
    const { data: lead, error: leadError } = await supabaseServer
      .from("leads")
      .select("phone_number, organization_id")
      .eq("id", leadId)
      .single();

    if (leadError || !lead) {
      return NextResponse.json({ error: "Lead no encontrado" }, { status: 404 });
    }

    // 2. Insertar el mensaje en el historial (messages)
    await supabaseServer.from("messages").insert({
      lead_id: leadId,
      sender: "agent",
      text: text
    });

    // 3. Pausar la IA automáticamente al intervenir un humano
    await supabaseServer
      .from("leads")
      .update({ ai_paused: true })
      .eq("id", leadId);

    // 4. Enviar el mensaje por WhatsApp a través de Evolution API
    const evolutionApiUrl = process.env.EVOLUTION_API_URL || "";
    const evolutionApiKey = process.env.EVOLUTION_API_KEY || "";
    const evolutionInstance = process.env.EVOLUTION_INSTANCE || "";

    if (evolutionApiUrl && evolutionApiKey && evolutionInstance) {
      await sendWhatsAppMessage(
        lead.phone_number,
        text,
        evolutionInstance,
        evolutionApiUrl,
        evolutionApiKey
      );
    } else {
      console.warn("[Send API] No se configuró Evolution API en las variables de entorno.");
    }

    return NextResponse.json({ success: true, message: "Mensaje enviado y IA pausada." });
  } catch (error) {
    console.error("[Send API] Error:", error);
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
  }
}
