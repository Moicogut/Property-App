import { VercelRequest, VercelResponse } from "@vercel/node";
import OpenAI from "openai";

export interface ScriptSceneItem {
  scene_number: number;
  image_prompt: string;
  video_prompt: string;
  narration: string;
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
  shotCount?: number; // 2, 3, 4
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
      shotCount = 3,
    }: FlowGeneratorPayload = req.body;

    const isVertical = aspectRatio === "9:16";
    const resText = isVertical ? "1080x1920" : "1920x1080";
    const activeCharacters = characters.slice(0, characterCount);

    const systemPrompt = `You are a world-class AI Film Director & Screenwriter specialized in Google Labs Flow and Google Veo 2 automation via script.json.

TASK:
Convert the real estate marketing concept into a multi-scene connected sequence of EXACTLY ${shotCount} scenes.
Each scene must be EXACTLY 10 SECONDS of spoken Spanish audio (~20-25 words) with 100% visual and wardrobe continuity.

MANDATORY RULES FOR THE OUTPUT:
1. Return STRICTLY a single JSON object with the exact root key "scenes":
{
  "scenes": [
    {
      "scene_number": 1,
      "image_prompt": "...",
      "video_prompt": "...",
      "narration": "..."
    }
  ]
}
2. Requirements for each field:
   - "image_prompt": Single plain text string. Start frame prompt in English with @ tokens (@personaje_1, @tablet, @logo, @atico, etc.), 8K hyperrealistic, aspect ratio ${aspectRatio} --ar ${aspectRatio}. NO line breaks, NO markdown, NO bullet points.
   - "video_prompt": Single plain text string. Action-first cinematographic prompt in English describing camera movement, 24fps motion, 5600K lighting, @ tokens, ending with exact audio directive: Audio: Native clear neutral Latin American Spanish voiceover speaking strictly in Spanish: '[narration text]', aspect ratio ${aspectRatio} --ar ${aspectRatio}. NO markdown, NO bullet points, NO line breaks.
   - "narration": Single plain text string. Exact spoken Spanish dialogue/narration for this 10-second scene (~20-25 words in natural Latin American Spanish). If multiple characters talk, include their speech naturally.

3. CONTINUITY ENFORCEMENT:
   - Character 1 (@personaje_1: ${activeCharacters[0] || "Asesora Wara"}) must keep exact same wardrobe, hair and features across all scenes.
   ${activeCharacters[1] ? `- Character 2 (@personaje_2: ${activeCharacters[1]}) must keep exact same wardrobe and features across all scenes.` : ""}
   - Scene progression:
     * Scene 1: Master Two-Shot (Hook dialogue 0-10s)
     * Scene 2: Close-up Insert UI / Interaction (Detail dialogue 10-20s)
     ${shotCount >= 3 ? "* Scene 3: Reaction / Second speaker turn (Conversation 20-30s)" : ""}
     ${shotCount >= 4 ? "* Scene 4: Wide Balcony/Rooftop Panoramic CTA (Call to action 30-40s)" : ""}
`;

    const userContent = `
Concept/Idea: ${idea}
Theme: ${theme}
Number of Scenes (10s each): ${shotCount}
Characters: ${activeCharacters.join(", ")}
Elements: ${elements.join(", ")}
Target City: ${city}
Aspect Ratio: ${aspectRatio}
Force Spanish Audio: ${forceSpanishAudio}
`;

    const apiKey = process.env.OPENAI_API_KEY;

    if (!apiKey) {
      const p1 = activeCharacters[0] || "Wara";
      const p2 = activeCharacters[1] || "Rolo";

      const fallbackScenes: ScriptSceneItem[] = [
        {
          scene_number: 1,
          image_prompt: `Cinematic vertical ${aspectRatio} portrait (${resText}) of @personaje_1 in burgundy blouse and @personaje_2 in navy suit standing in modern luxury penthouse in ${city} with @logo and @tablet, 8k, aspect ratio ${aspectRatio} --ar ${aspectRatio}`,
          video_prompt: `Cinematic vertical ${aspectRatio} medium two-shot (${resText}), camera tracks smoothly towards @personaje_1 conversing naturally with @personaje_2 holding glass @tablet with official @logo inside @atico in ${city}, soft 5600K key light, 3200K rim lighting, 24fps, Audio: Native clear neutral Latin American Spanish voiceover speaking strictly in Spanish: '${p1}: Con el Crédito VIS compras tu departamento por solo 285 dólares al mes en lugar de alquilar.', aspect ratio ${aspectRatio} --ar ${aspectRatio}`,
          narration: `Con el Crédito VIS compras tu departamento por solo 285 dólares al mes en lugar de alquilar.`
        },
        {
          scene_number: 2,
          image_prompt: `Cinematic vertical ${aspectRatio} macro close-up (${resText}) of a sleek glass tablet displaying mortgage amortization chart with 5.5% VIS rate and @logo, 8k, aspect ratio ${aspectRatio} --ar ${aspectRatio}`,
          video_prompt: `Cinematic vertical ${aspectRatio} close-up insert (${resText}), camera focuses on hands of @personaje_1 actively tapping the mortgage calculation on screen of @tablet held by @personaje_2, showing 5.5% rate and $285 monthly payment with glowing @logo, 24fps, Audio: Native clear neutral Latin American Spanish voiceover speaking strictly in Spanish: '${p2}: La tasa del 5.5% está regulada por ley, lo que asegura tu cuota fija durante todo el crédito.', aspect ratio ${aspectRatio} --ar ${aspectRatio}`,
          narration: `La tasa del 5.5% está regulada por ley, lo que asegura tu cuota fija durante todo el crédito.`
        },
        {
          scene_number: 3,
          image_prompt: `Cinematic vertical ${aspectRatio} wide shot (${resText}) of real estate professional @personaje_1 on luxury rooftop terrace in ${city} with 3D golden @logo, 8k, aspect ratio ${aspectRatio} --ar ${aspectRatio}`,
          video_prompt: `Cinematic vertical ${aspectRatio} smooth tracking shot (${resText}) of @personaje_1 on the open panoramic @terraza in ${city} with subtle city bokeh and 3D floating @logo plaque, confident welcoming gesture, 24fps, Audio: Native clear neutral Latin American Spanish voiceover speaking strictly in Spanish: '${p1}: Comenta la palabra CALCULAR y te paso el simulador bancario directo a tu WhatsApp.', aspect ratio ${aspectRatio} --ar ${aspectRatio}`,
          narration: `Comenta la palabra CALCULAR y te paso el simulador bancario directo a tu WhatsApp.`
        }
      ];

      return res.status(200).json({
        scenes: fallbackScenes.slice(0, shotCount)
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

    // Sanitize: ensure exact {"scenes": [...]} structure
    const scenesList = Array.isArray(parsed.scenes) ? parsed.scenes : (Array.isArray(parsed) ? parsed : []);

    const sanitizedScenes = scenesList.map((s: any, idx: number) => ({
      scene_number: idx + 1,
      image_prompt: typeof s.image_prompt === "string" ? s.image_prompt.replace(/[\r\n]+/g, " ").trim() : "",
      video_prompt: typeof s.video_prompt === "string" ? s.video_prompt.replace(/[\r\n]+/g, " ").trim() : "",
      narration: typeof s.narration === "string" ? s.narration.replace(/[\r\n]+/g, " ").trim() : ""
    }));

    return res.status(200).json({
      scenes: sanitizedScenes
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error compiling script.json";
    console.error("[api/ai/compile-prompt] Error:", error);
    return res.status(500).json({ error: msg });
  }
}
