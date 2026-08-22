import { VercelRequest, VercelResponse } from "@vercel/node";
import OpenAI from "openai";

export interface FlowGeneratorPayload {
  idea: string;
  theme: string;
  characterCount: number; // 1, 2, 3, 4
  characters?: string[];
  elements: string[]; // ['Logo', 'Afiche', 'Cocina', 'Tablet', etc.]
  city?: string;
  aspectRatio?: "9:16" | "16:9";
  forceSpanishAudio?: boolean;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      idea = "",
      theme = "Crédito VIS & Cuotas",
      characterCount = 1,
      characters = ["Asesora Inmobiliaria"],
      elements = ["Logo", "Tablet con Cotizador", "Penthouse"],
      city = "Santa Cruz",
      aspectRatio = "9:16",
      forceSpanishAudio = true,
    }: FlowGeneratorPayload = req.body;

    const isVertical = aspectRatio === "9:16";
    const resText = isVertical ? "1080x1920" : "1920x1080";

    const systemPrompt = `You are a Hollywood-grade AI Director and Prompt Engineer specialized in Google Labs Flow and Google Veo 2 video generation for Real Estate marketing.

TASK:
Take the user's concept, theme, characters (${characterCount} character(s)), and visual elements to produce a production-ready video scene.

OUTPUT STRUCTURE:
1. "prompt_en": Complete cinematic video prompt in ENGLISH for Google Labs Flow.
   - Describe camera movements (push-in, tracking, panning), lighting (5600K key light, 3200K champagne-gold rim light), lens, 24fps motion.
   - Inject the character tokens (@personaje_1${characterCount > 1 ? ", @personaje_2" : ""}) and element tokens (e.g. @logo, @afiche, @escenario, @producto).
   - If audio directive is active, append: Audio: Native clear neutral Latin American Spanish voiceover speaking strictly in Spanish: '[full audio dialogue]', aspect ratio ${aspectRatio} --ar ${aspectRatio}
2. "guion_es": Complete scene direction and description in SPANISH.
3. "audio_dialogues": Array of dialogue objects for each character:
   [
     { "character": "Personaje 1 (ej. Asesora)", "dialogue": "Texto exacto en español que dice este personaje..." }
     ${characterCount > 1 ? ', { "character": "Personaje 2 (ej. Cliente)", "dialogue": "Respuesta o pregunta en español..." }' : ""}
   ]
4. "image_prompt": Start frame prompt in English (${resText}, 8k, aspect ratio ${aspectRatio}).

Return strictly a JSON object with this exact schema:
{
  "theme": "${theme}",
  "guion_es": "Descripción cinematográfica completa en español...",
  "prompt_en": "Cinematic vertical ${aspectRatio} format...",
  "image_prompt": "Cinematic vertical ${aspectRatio} portrait (${resText})...",
  "audio_dialogues": [
    {
      "character": "Nombre o Rol del Personaje",
      "dialogue": "Texto que habla en español..."
    }
  ]
}`;

    const userContent = `
Concept / Idea: ${idea}
Theme: ${theme}
Number of Characters: ${characterCount}
Character Details: ${characters.join(", ")}
Elements to include: ${elements.join(", ")}
Target City: ${city}
Aspect Ratio: ${aspectRatio}
Force Spanish Audio Directive: ${forceSpanishAudio}
`;

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      // Fallback generator
      const fallbackAudio = characterCount > 1
        ? [
            { character: "Personaje 1 (Asesora)", dialogue: `Con el plan de financiamiento en ${city}, tu cuota queda menor a lo que pagas de alquiler.` },
            { character: "Personaje 2 (Cliente)", dialogue: "¿Y puedo aplicar con crédito VIS al 5.5% regulado?" },
          ]
        : [
            { character: "Personaje 1 (Asesora)", dialogue: `Si buscas la mejor opción inmobiliaria en ${city}, con Crédito VIS pagas cuota fija de $285 al mes. Comenta CALCULAR.` }
          ];

      const fullDialogueText = fallbackAudio.map(a => `${a.character}: ${a.dialogue}`).join(" ");

      return res.status(200).json({
        theme: theme,
        guion_es: `La asesora @personaje_1 presenta el inmueble en ${city} con ${elements.join(", ")}. Explica los beneficios comerciales con seguridad y autoridad.`,
        prompt_en: `Cinematic vertical ${aspectRatio} shot (${resText}) of @personaje_1 presenting real estate property in ${city} with ${elements.map(e => `@${e.toLowerCase().replace(/\s+/g, "_")}`).join(", ")}, smooth 24fps movement, 5600K key light, ${forceSpanishAudio ? `Audio: Native clear neutral Latin American Spanish voiceover speaking strictly in Spanish: '${fullDialogueText}', ` : ""}aspect ratio ${aspectRatio} --ar ${aspectRatio}`,
        image_prompt: `Cinematic vertical ${aspectRatio} portrait (${resText}) of @personaje_1 in modern luxury set in ${city} with ${elements.map(e => `@${e.toLowerCase().replace(/\s+/g, "_")}`).join(", ")}, 8k, aspect ratio ${aspectRatio} --ar ${aspectRatio}`,
        audio_dialogues: fallbackAudio,
      });
    }

    const openai = new OpenAI({ apiKey });
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const rawJson = response.choices[0].message.content || "{}";
    const parsed = JSON.parse(rawJson);

    return res.status(200).json(parsed);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error generating prompt";
    console.error("[api/ai/compile-prompt] Error:", error);
    return res.status(500).json({ error: msg });
  }
}
