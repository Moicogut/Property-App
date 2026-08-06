import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || "";
const supabaseServer = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { appointment_id, rating, notes } = req.body;

    if (!appointment_id || rating === undefined) {
      return res.status(400).json({ error: "appointment_id and rating are required" });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "rating must be between 1 and 5" });
    }

    // Update appointment in Supabase
    const { data: appointment, error: aptError } = await supabaseServer
      .from("appointments")
      .update({
        rating,
        notes: notes || null
      })
      .eq("id", appointment_id)
      .select()
      .single();

    if (aptError) {
      console.error("Supabase Error saving feedback:", aptError);
      return res.status(500).json({ error: "Error saving feedback" });
    }

    // Optionally update lead pipeline stage if rating is good (e.g., VISITA_REALIZADA or EN_NEGOCIACION)
    if (appointment && appointment.lead_id) {
      const newStage = rating >= 4 ? "EN_NEGOCIACION" : "VISITA_REALIZADA";
      await supabaseServer
        .from("leads")
        .update({ pipeline_stage: newStage })
        .eq("id", appointment.lead_id);
    }

    return res.status(200).json({ 
      success: true, 
      appointment
    });

  } catch (err: any) {
    console.error("Error creating feedback:", err);
    return res.status(500).json({ error: err.message });
  }
}
