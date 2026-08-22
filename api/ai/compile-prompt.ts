import { VercelRequest, VercelResponse } from "@vercel/node";
import OpenAI from "openai";

export interface FlowPromptRequest {
  idea?: string;
  spanishDescription?: string;
  narration?: string;
  city?: string;
  aspectRatio?: "9:16" | "16:9";
  tokens?: {
    model1?: string;
    enableModel2?: boolean;
    model2?: string;
    logo?: string;
    escena?: string;
    producto?: string;
    afiche?: string;
  };
  forceSpanishAudio?: boolean;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const {
      idea = "",
      spanishDescription = "",
      narration = "",
      city = "Santa Cruz",
      aspectRatio = "9:16",
      tokens = {},
      forceSpanishAudio = true,
    }: FlowPromptRequest = req.body;

    const tokenModel1 = tokens.model1 || "HRP Modelo WARA 02.jpeg";
    const tokenModel2 = tokens.enableModel2 && tokens.model2 ? tokens.model2 : "";
    const tokenLogo = tokens.logo || "logo.a.png";
    const tokenEscena = tokens.escena || "ático SCZ 01.jpg";
    const tokenProducto = tokens.producto || "UI_Cotizador_VIS.png";
    const tokenAfiche = tokens.afiche || "Afiche_48000_USD.png";

    const isVertical = aspectRatio === "9:16";
    const resolution = isVertical ? "full 1080x1920 resolution" : "full 1920x1080 resolution";

    const systemPrompt = `You are an elite Hollywood-grade AI Cinematographer and Prompt Engineer specialized in Google Labs Flow and Google Veo 2 video generation.

Your goal is to convert real estate marketing concepts into perfectly formatted multimodal prompts for Google Labs Flow.

RULES FOR GOOGLE LABS FLOW TOKENS:
1. You MUST inject the exact asset tokens using the "@" prefix:
   - Character 1: @${tokenModel1}
   ${tokenModel2 ? `- Character 2: @${tokenModel2}` : ""}
   - Brand/Logo: @${tokenLogo}
   - Set/Environment: @${tokenEscena}
   - Product/UI: @${tokenProducto}
   - Ad Banner/Poster: @${tokenAfiche}
2. FORMAT STRUCTURE FOR VIDEO PROMPT:
   [Camera motion in ${aspectRatio}] of the advisor @${tokenModel1} [action/gesture], [interaction with UI/product @${tokenProducto} or logo @${tokenLogo}], inside @${tokenEscena}, smooth 24fps cinematic movement, 5600K key light with 3200K champagne-gold rim lighting, ${
      forceSpanishAudio
        ? "Audio: Native clear neutral Latin American Spanish voiceover speaking strictly in Spanish: '[narration]', "
        : ""
    }aspect ratio ${aspectRatio} --ar ${aspectRatio}
3. FORMAT STRUCTURE FOR IMAGE START FRAME PROMPT:
   Cinematic vertical ${aspectRatio} portrait (${resolution}) of real estate professional @${tokenModel1} [details]; holding/displaying @${tokenProducto}; set in luxury penthouse/environment in ${city} @${tokenEscena} with @${tokenLogo}; diffused 5600K key lighting with subtle 3200K rim lighting; hyper-realistic 8K, ${aspectRatio} aspect ratio --ar ${aspectRatio}, Spanish-language audio.
4. NARRATION RULES:
   - Must be written in natural, high-converting Latin American Spanish (persuasive, punchy, 10-20 seconds max).
   - Must have a clear hook, value proposition, and call to action (e.g., "Comenta CALCULAR", "Comenta BOT", "Escríbeme").

Return strictly a JSON object with this exact schema:
{
  "spanish_description": "Breve descripción en español de la escena visual",
  "narration": "Guión completo de locución en español para el video",
  "video_prompt": "Cinematic video prompt in English with @ tokens and Audio directive",
  "image_prompt": "Cinematic image start frame prompt in English with @ tokens"
}`;

    const userContent = `
City: ${city}
Aspect Ratio: ${aspectRatio}
Tokens available:
- Model 1: @${tokenModel1}
${tokenModel2 ? `- Model 2: @${tokenModel2}` : ""}
- Logo: @${tokenLogo}
- Scene/Set: @${tokenEscena}
- Product: @${tokenProducto}
- Banner: @${tokenAfiche}

User Input:
${idea ? `Main Concept / Idea: "${idea}"` : ""}
${spanishDescription ? `Existing Scene Description: "${spanishDescription}"` : ""}
${narration ? `Existing Spanish Narration: "${narration}"` : ""}

Generate the polished Spanish script, English Flow video prompt, and English Flow image prompt.`;

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      // Fallback deterministic generator if API key is not present
      const fallbackNarration = narration || (idea ? `Descubre esta oportunidad única en ${city}. ${idea}. Escríbeme un mensaje y te asesoro hoy mismo.` : `Si buscas la mejor opción inmobiliaria en ${city}, contáctanos para asesorarte paso a paso.`);
      const fallbackDesc = spanishDescription || idea || `Asesora inmobiliaria presentando oportunidad en ${city}.`;
      const fallbackVideo = `Camera performs a smooth cinematic push-in in ${aspectRatio} towards the advisor @${tokenModel1} as she presents with confidence holding @${tokenProducto}, inside @${tokenEscena} with logo @${tokenLogo}, smooth 24fps movement, 5600K lighting, Audio: Native clear neutral Latin American Spanish voiceover speaking strictly in Spanish: '${fallbackNarration}', aspect ratio ${aspectRatio} --ar ${aspectRatio}`;
      const fallbackImage = `Cinematic vertical ${aspectRatio} portrait (${resolution}) of a 30-year-old Latina real estate professional @${tokenModel1}; holding @${tokenProducto}; set in modern luxury penthouse in ${city} @${tokenEscena} with @${tokenLogo}; diffused 5600K key lighting with subtle 3200K rim lighting; hyper-realistic 8K, ${aspectRatio} aspect ratio --ar ${aspectRatio}, Spanish-language audio.`;

      return res.status(200).json({
        spanish_description: fallbackDesc,
        narration: fallbackNarration,
        video_prompt: fallbackVideo,
        image_prompt: fallbackImage,
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

    return res.status(200).json({
      spanish_description: parsed.spanish_description || spanishDescription || idea,
      narration: parsed.narration || narration,
      video_prompt: parsed.video_prompt,
      image_prompt: parsed.image_prompt,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Error compiling prompt";
    console.error("[api/ai/compile-prompt] Error:", error);
    return res.status(500).json({ error: msg });
  }
}
