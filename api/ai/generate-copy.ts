import { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabaseServer = createClient(supabaseUrl, supabaseKey);
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { propertyId } = req.body;
    if (!propertyId) {
      return res.status(400).json({ error: 'propertyId required' });
    }

    const { data: property, error } = await supabaseServer
      .from('properties')
      .select('*')
      .eq('id', propertyId)
      .single();

    if (error || !property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    
    // Fetch dynamic prompt from DB
    const { data: promptConfig } = await supabaseServer
      .from('system_prompts')
      .select('prompt_text')
      .eq('key', 'COPY_GENERATOR')
      .single();

    const systemPrompt = promptConfig?.prompt_text || `Eres un Copywriter Inmobiliario Elite especializado en Ads.
Genera 2 variantes de copy persuasivo (Estructura Hook + Beneficios + CTA directo) y 1 Prompt para generar la imagen publicitaria en Midjourney/DALL-E.

FORMATO REQUERIDO (Estricto, sin marcas de markdown ### ni **):

OPCION 1: INSTAGRAM / FACEBOOK
[Texto altamente persuasivo con emojis estratégicos]

OPCION 2: TIKTOK / WHATSAPP SHORT
[Texto directo al grano, enfocado en escasez o inversión]

PROMPT DE IMAGEN IA (Midjourney / DALL-E / Flux):
[Prompt detallado en inglés optimizado para render fotorrealista del inmueble, iluminación arquitectónica y estilo editorial]`;

    const userPrompt = `
Información del inmueble a promocionar:
- Título: ${property.title}
- Precio: $${property.price_usd} USD
- Zona: ${property.zone}, ${property.city}
- Descripción original: ${property.raw_description}
- Habitaciones: ${property.bedrooms} | Baños: ${property.bathrooms}
- ¿Compatible Crédito VIS/ASFI?: ${property.accepts_social_housing ? 'Sí' : 'No'}
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const copyText = response.choices[0].message.content || '';

    return res.status(200).json({ copy: copyText });
  } catch (error: any) {
    console.error("Error al generar copy con IA:", error);
    return res.status(500).json({ error: error.message || 'Error interno al generar copy' });
  }
}
