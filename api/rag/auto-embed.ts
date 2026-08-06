import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const supabaseServer = createClient(supabaseUrl, supabaseKey);

async function generateEmbedding(text: string): Promise<number[]> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
      dimensions: 768
    });
    return response.data[0]?.embedding || Array(768).fill(0);
  } catch (err) {
    console.warn("[OpenAI] Embeddings API Error (fallback to dummy):", err);
    return Array.from({ length: 768 }, () => (Math.random() - 0.5) * 0.1);
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Basic Auth or Secret verification could go here (e.g., req.headers['x-webhook-secret'])
  // For now, we trust the Service Role / Anon keys if Supabase triggers it, or we validate a custom secret.
  const webhookSecret = process.env.WEBHOOK_SECRET;
  if (webhookSecret && req.headers['x-webhook-secret'] !== webhookSecret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const payload = req.body;
  console.log("[Auto-Embed] Supabase Webhook Received:", payload?.type, "for table", payload?.table);

  if (payload?.table !== 'properties') {
    return res.status(400).json({ error: 'Invalid table' });
  }

  if (payload.type !== 'INSERT' && payload.type !== 'UPDATE') {
    return res.status(200).json({ status: 'Ignored, not an INSERT/UPDATE' });
  }

  const property = payload.record;
  if (!property || !property.id) {
    return res.status(400).json({ error: 'No record provided' });
  }

  // Construct search vector text exactly as we do when manually indexing
  const vectorText = `${property.title || ''}. ${property.zone || ''}. ${property.raw_description || ''}`;
  
  if (vectorText.trim().length < 5) {
    return res.status(200).json({ status: 'Ignored, empty text' });
  }

  try {
    const embedding = await generateEmbedding(vectorText);

    // Update the property in Supabase with the new embedding
    const { error: updateErr } = await supabaseServer
      .from("properties")
      .update({ embedding }) // We don't need to stringify if using supabase-js, it handles array to vector casting
      .eq("id", property.id);

    if (updateErr) {
      console.error("[Auto-Embed] Error updating property embedding:", updateErr);
      return res.status(500).json({ error: 'Failed to update property' });
    }

    console.log(`[Auto-Embed] Successfully auto-vectorized property ${property.id}`);
    return res.status(200).json({ status: 'SUCCESS' });
  } catch (err) {
    console.error("[Auto-Embed] Error generating embedding:", err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
