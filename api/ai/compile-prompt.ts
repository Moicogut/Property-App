import { VercelRequest, VercelResponse } from "@vercel/node";
import OpenAI from "openai";

export interface FlowSequenceShot {
  shot_number: number;
  shot_type: string; // "Master Two-Shot (0-10s)", "Close-Up Insert UI (10-20s)", "Over-The-Shoulder Reaction (20-30s)", "Wide Rooftop CTA (30-40s)"
  duration_seconds: number;
  guion_es: string;
  prompt_en: string;
  image_prompt: string;
  audio_dialogues: Array<{
    character: string;
    dialogue: string;
  }>;
}

export interface FlowGeneratorPayload {
  idea: string;
  theme: string;
  characterCount: number;
  characters?: string[];
  elements: string[];
  city?: string;
  aspectRatio?: "9:16" | "16:9";
  forceSpanishAudio?: boolean;
  mode?: "sequence" | "single"; // "sequence" generates 2-4 connected 10s shots
  shotCount?: number; // 2, 3, 4 shots
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      idea = "",
      theme = "Crédito VIS & Cuotas ($285/mes)",
      characterCount = 2,
      characters = ["Asesora Senior (Wara)", "Asesor Senior (Rolo)"],
      elements = ["Logo (@logo)", "Tablet con Cotizador (@tablet)", "Ático / Penthouse (@atico)"],
      city = "Santa Cruz",
      aspectRatio = "9:16",
      forceSpanishAudio = true,
      mode = "sequence",
      shotCount = 3,
    }: FlowGeneratorPayload = req.body;

    const isVertical = aspectRatio === "9:16";
    const resText = isVertical ? "1080x1920" : "1920x1080";
    const activeCharacters = characters.slice(0, characterCount);

    const systemPrompt = `You are a world-class AI Film Director specialized in Google Labs Flow and Google Veo 2 video production for Real Estate campaigns.

GOAL:
Generate a production-ready, perfectly linked cinematic sequence of ${mode === "sequence" ? shotCount : 1} consecutive shot(s) of EXACTLY 10 SECONDS EACH (~22-28 spoken Spanish words per 10s shot).

CONTINUITY & CINEMATOGRAPHY RULES (CRITICAL):
1. CONTINUITY ENFORCEMENT:
   - In all shots of the sequence, the characters MUST retain 100% consistent attire, hair color, and lighting scheme (5600K diffused key light + 3200K champagne-gold rim lighting).
   - If @personaje_1 is Wara (burgundy sleeveless top / black tailored blazer) and @personaje_2 is Rolo (navy blue blazer, light blue shirt), explicitly keep their wardrobe identical in every single prompt.
   - Use identical scene environment tokens (@atico, @sala, @terraza, etc.) across the cuts.

2. SHOT-BY-SHOT PROGRESSION (For ${shotCount} connected shots):
   - SHOT 1 (Hook / Master Setup, 00:00-00:10):
     * Angle: Medium Two-Shot or Dolly Push-in.
     * Action: Active interaction between characters (@personaje_1 opens with hook, gestures to @personaje_2 holding @tablet).
     * Audio: Hook dialogue (10s max).
   - SHOT 2 (Detail / UI Interaction, 00:10-00:20):
     * Angle: Tight Close-up / Over-the-shoulder macro insert.
     * Action: Hands pointing at screen numbers (5.5% VIS, $285/mo, CMA heatmap) on @tablet / @smartphone with @logo.
     * Audio: Deep value proposition dialogue.
   - SHOT 3 (Reaction / Conversation Turn, 00:20-00:30):
     * Angle: Over-the-shoulder / Medium Close-up on the second character (@personaje_2) reacting, nodding and addressing camera.
     * Audio: Secondary character speaks, confirming terms.
   - SHOT 4 (Wide Environment / Rooftop CTA, 00:30-00:40):
     * Angle: Wide Panoramic tracking shot on balcony/terrace (@terraza) overlooking ${city}, ending with 3D @logo branding plaque.
     * Audio: Strong Call-To-Action ("Comenta CALCULAR", "Comenta PRECIO").

3. PROMPT SYNTAX FOR GOOGLE LABS FLOW:
   - Action-first verbs (e.g. "Camera tracks smoothly as @personaje_1 actively taps the glass @tablet held by @personaje_2, while @personaje_2 nods and smiles towards camera inside @atico in ${city}...").
   - Strict 24fps motion, 5600K lighting, lens focal length (35mm/50mm/85mm).
   - Audio directive at end: Audio: Native clear neutral Latin American Spanish voiceover speaking strictly in Spanish: '[character dialogues of this 10s shot]', aspect ratio ${aspectRatio} --ar ${aspectRatio}

4. RESPONSE SCHEMA:
Return strictly a JSON object with this exact structure:
{
  "theme": "${theme}",
  "total_shots": ${mode === "sequence" ? shotCount : 1},
  "total_duration_seconds": ${mode === "sequence" ? shotCount * 10 : 10},
  "shots": [
    {
      "shot_number": 1,
      "shot_type": "Toma 1: Master Two-Shot (00:00 - 00:10)",
      "duration_seconds": 10,
      "guion_es": "Descripción cinemática en español de la primera toma...",
      "prompt_en": "Cinematic vertical ${aspectRatio} format...",
      "image_prompt": "Cinematic vertical ${aspectRatio} portrait (${resText})...",
      "audio_dialogues": [
        { "character": "${activeCharacters[0] || "Personaje 1"}", "dialogue": "Texto exacto en español..." }
      ]
    }
  ]
}`;

    const userContent = `
Concept/Idea: ${idea}
Theme: ${theme}
Number of Characters: ${characterCount}
Character Names & Roles: ${activeCharacters.join(", ")}
Elements to include: ${elements.join(", ")}
Target City: ${city}
Aspect Ratio: ${aspectRatio}
Force Spanish Audio: ${forceSpanishAudio}
Mode: ${mode}
Requested Number of 10s Shots: ${shotCount}
`;

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      // Fallback deterministic sequence generator
      const p1 = activeCharacters[0] || "Personaje 1";
      const p2 = activeCharacters[1] || "Personaje 2";

      const fallbackShots: FlowSequenceShot[] = [
        {
          shot_number: 1,
          shot_type: "Toma 1: Master Two-Shot / Hook (00:00 - 00:10)",
          duration_seconds: 10,
          guion_es: `Plano conjunto medio: ${p1} y ${p2} conversan en el @atico de ${city}. ${p1} presenta la oportunidad de compra mientras ${p2} sostiene la @tablet.`,
          prompt_en: `Cinematic vertical ${aspectRatio} medium two-shot (${resText}) of @personaje_1 conversing naturally with @personaje_2 holding a glass @tablet with official @logo inside @atico in ${city}, soft 5600K key light, 3200K rim lighting, 24fps, Audio: Native clear neutral Latin American Spanish voiceover speaking strictly in Spanish: '${p1}: Con el Crédito VIS compras tu departamento por solo $285 al mes en lugar de alquilar.', aspect ratio ${aspectRatio} --ar ${aspectRatio}`,
          image_prompt: `Cinematic vertical ${aspectRatio} portrait (${resText}) of @personaje_1 and @personaje_2 in luxury penthouse in ${city} with @logo and @tablet, 8k, aspect ratio ${aspectRatio} --ar ${aspectRatio}`,
          audio_dialogues: [
            { character: p1, dialogue: "Con el Crédito VIS compras tu departamento por solo $285 al mes en lugar de alquilar." }
          ]
        },
        {
          shot_number: 2,
          shot_type: "Toma 2: Close-up Insert UI (00:10 - 00:20)",
          duration_seconds: 10,
          guion_es: `Plano detalle a la pantalla de la @tablet: Manos de ${p1} señalando la tasa de interés del 5.5% regulada por ley y la cuota fija mensual.`,
          prompt_en: `Cinematic vertical ${aspectRatio} close-up insert (${resText}) focusing on hands of @personaje_1 actively tapping the mortgage calculation on screen of @tablet held by @personaje_2, showing 5.5% rate and $285 monthly payment with glowing @logo, 24fps, Audio: Native clear neutral Latin American Spanish voiceover speaking strictly in Spanish: '${p2}: La tasa del 5.5% está regulada por ley, lo que asegura tu cuota fija durante todo el crédito.', aspect ratio ${aspectRatio} --ar ${aspectRatio}`,
          image_prompt: `Cinematic vertical ${aspectRatio} macro close-up (${resText}) of a sleek glass tablet displaying mortgage amortization chart with 5.5% VIS rate and @logo, 8k, aspect ratio ${aspectRatio} --ar ${aspectRatio}`,
          audio_dialogues: [
            { character: p2, dialogue: "La tasa del 5.5% está regulada por ley, lo que asegura tu cuota fija durante todo el crédito." }
          ]
        },
        {
          shot_number: 3,
          shot_type: "Toma 3: Panorámica Terraza & Cierre (00:20 - 00:30)",
          duration_seconds: 10,
          guion_es: `Corte continuo a la @terraza: ${p1} camina hacia el ventanal con vista panorámica de ${city}, invitando a comentar para recibir el simulador bancario.`,
          prompt_en: `Cinematic vertical ${aspectRatio} smooth tracking shot (${resText}) of @personaje_1 on the open panoramic @terraza in ${city} with subtle city bokeh and 3D floating @logo plaque, confident welcoming gesture, 24fps, Audio: Native clear neutral Latin American Spanish voiceover speaking strictly in Spanish: '${p1}: Comenta la palabra CALCULAR y te paso el simulador bancario directo a tu WhatsApp.', aspect ratio ${aspectRatio} --ar ${aspectRatio}`,
          image_prompt: `Cinematic vertical ${aspectRatio} wide shot (${resText}) of real estate professional @personaje_1 on luxury rooftop terrace in ${city} with 3D golden @logo, 8k, aspect ratio ${aspectRatio} --ar ${aspectRatio}`,
          audio_dialogues: [
            { character: p1, dialogue: "Comenta la palabra CALCULAR y te paso el simulador bancario directo a tu WhatsApp." }
          ]
        }
      ];

      const returnedShots = fallbackShots.slice(0, mode === "sequence" ? shotCount : 1);

      return res.status(200).json({
        theme,
        total_shots: returnedShots.length,
        total_duration_seconds: returnedShots.length * 10,
        shots: returnedShots,
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
      temperature: 0.65,
    });

    const rawJson = response.choices[0].message.content || "{}";
    const parsed = JSON.parse(rawJson);

    return res.status(200).json(parsed);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error generating prompt sequence";
    console.error("[api/ai/compile-prompt] Error:", error);
    return res.status(500).json({ error: msg });
  }
}
