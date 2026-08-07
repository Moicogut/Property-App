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
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
      max_tokens: 500,
    });

    const copyText = response.choices[0].message.content || '';

    return res.status(200).json({ copy: copyText });
  } catch (error: any) {
    console.error("Error al generar copy con IA:", error);
    return res.status(500).json({ error: error.message || 'Error interno al generar copy' });
  }
}
