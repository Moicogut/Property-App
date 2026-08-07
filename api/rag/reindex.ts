import type { VercelRequest, VercelResponse } from '@vercel/node';
import OpenAI from "openai";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const supabaseServer = createClient(supabaseUrl, supabaseKey);

async function generateEmbedding(text: string): Promise<number[]> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
    dimensions: 768
  });
  return response.data[0]?.embedding || Array(768).fill(0);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  // Fetch ALL properties that don't have embeddings yet (embedding IS NULL)
  const { data: properties, error } = await supabaseServer
    .from("properties")
    .select("id, title, zone, raw_description, city, price_usd")
    .is("embedding", null);

  if (error) {
    console.error("[Reindex] Error fetching properties:", error);
    return res.status(500).json({ error: "Failed to fetch properties" });
  }

  if (!properties || properties.length === 0) {
    return res.status(200).json({ status: "OK", message: "All properties already have embeddings.", reindexed: 0 });
  }

  let successCount = 0;
  let failCount = 0;
  const results: { id: string; title: string; status: string }[] = [];

  for (const property of properties) {
    const vectorText = `${property.title || ''}. ${property.zone || ''} ${property.city || ''}. Precio: $${property.price_usd || 0} USD. ${property.raw_description || ''}`;

    if (vectorText.trim().length < 5) {
      results.push({ id: property.id, title: property.title, status: "SKIPPED_EMPTY" });
      continue;
    }

    try {
      const embedding = await generateEmbedding(vectorText);

      const { error: updateErr } = await supabaseServer
        .from("properties")
        .update({ embedding })
        .eq("id", property.id);

      if (updateErr) {
        console.error(`[Reindex] Error updating property ${property.id}:`, updateErr);
        results.push({ id: property.id, title: property.title, status: "ERROR" });
        failCount++;
      } else {
        results.push({ id: property.id, title: property.title, status: "SUCCESS" });
        successCount++;
      }
    } catch (err) {
      console.error(`[Reindex] Error generating embedding for ${property.id}:`, err);
      results.push({ id: property.id, title: property.title, status: "ERROR" });
      failCount++;
    }
  }

  console.log(`[Reindex] Completed: ${successCount} success, ${failCount} failed out of ${properties.length} total.`);

  return res.status(200).json({
    status: "REINDEX_COMPLETE",
    total: properties.length,
    success: successCount,
    failed: failCount,
    results,
  });
}
