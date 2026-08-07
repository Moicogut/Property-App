import { NextResponse } from "next/server";
import OpenAI from "openai";
import { supabaseServer } from "@/src/lib/supabase-server";

export async function POST(request: Request) {
  try {
    const { propertyId } = await request.json();
    if (!propertyId) {
      return NextResponse.json({ error: "propertyId required" }, { status: 400 });
    }

    const { data: property, error } = await supabaseServer
      .from("properties")
      .select("*")
      .eq("id", propertyId)
      .single();

    if (error || !property) {
      return NextResponse.json({ error: "Property not found" }, { status: 404 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    const prompt = `
Eres un experto copywriter inmobiliario. Genera 2 opciones de texto persuasivo (copy) para publicar este inmueble en Facebook e Instagram, usando emojis y un llamado a la acción (Call to Action).
Información del inmueble:
- Título: ${property.title}
- Precio: $${property.price_usd} USD
- Zona: ${property.zone}
- Descripción original: ${property.raw_description}
- Habitaciones: ${property.bedrooms} | Baños: ${property.bathrooms}

Devuelve las 2 opciones en texto claro.
`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    });

    const copyText = response.choices[0].message.content || "";

    return NextResponse.json({ copy: copyText }, { status: 200 });
  } catch (error) {
    console.error("[Generate Copy] Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
