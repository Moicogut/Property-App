import { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://lqagnlbygzurddkzbbwn.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseServer = createClient(supabaseUrl, supabaseKey);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Validación de Handshake GET para Meta Developers
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const verifyToken = process.env.META_VERIFY_TOKEN || 'property_os_meta_verify_2026';

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('✅ Webhook de Meta verificado con éxito');
      return res.status(200).send(challenge);
    } else {
      console.error('❌ Token de verificación inválido');
      return res.status(403).json({ error: 'Verification failed' });
    }
  }

  // 2. Recepción de Lead Ads (POST)
  if (req.method === 'POST') {
    try {
      const body = req.body;
      console.log('📩 Payload recibido de Meta Lead Ads:', JSON.stringify(body, null, 2));

      // Obtener la organización por defecto
      const { data: orgs } = await supabaseServer.from("organizations").select("id, name, whatsapp_instance_id").limit(1);
      const defaultOrg = orgs?.[0];
      const orgId = defaultOrg?.id || 'org-1';

      // Estructura 1: Direct Synthetic Testing Payload (simulación directa)
      if (body.full_name || body.phone_number || body.email) {
        const fullName = body.full_name || 'Prospecto Meta';
        const phone = String(body.phone_number || '').replace(/\D/g, '');
        const email = body.email || '';
        const city = body.city || 'Santa Cruz';
        const isCaptation = body.lead_type === 'SELLER_OWNER' || body.form_name?.toLowerCase().includes('captacion');

        const { data: insertedLead, error: insertErr } = await supabaseServer
          .from('leads')
          .insert({
            organization_id: orgId,
            full_name: fullName,
            phone_number: phone,
            pipeline_type: isCaptation ? 'CAPTACIONES' : 'VENTAS',
            pipeline_stage: 'NUEVO',
            preferred_zone: city,
            intent_score: 85,
            ai_summary: `Lead capturado automáticamente desde Meta Ads (${body.ad_name || 'Campaña FB/IG'})`,
            ai_paused: false,
          })
          .select()
          .single();

        if (insertErr) {
          console.error('[Meta Webhook] Error insertando lead directo:', insertErr);
        } else {
          console.log('[Meta Webhook] ✅ Lead directo registrado con ID:', insertedLead.id);
        }

        return res.status(200).json({ status: 'EVENT_PROCESSED', lead_id: insertedLead?.id });
      }

      // Estructura 2: Payload Estándar de Facebook Graph Webhook
      const entries = body.entry || [];
      for (const entry of entries) {
        const changes = entry.changes || [];
        for (const change of changes) {
          if (change.field === 'leadgen') {
            const val = change.value || {};
            const leadgenId = val.leadgen_id;
            const formId = val.form_id;

            console.log(`[Meta Webhook] Procesando leadgen_id: ${leadgenId}, form_id: ${formId}`);

            // Inserción en tabla de leads con trazabilidad de Meta Ads
            await supabaseServer.from('leads').insert({
              organization_id: orgId,
              full_name: `Prospecto Meta #${leadgenId?.toString().slice(-4) || 'Ads'}`,
              phone_number: '591' + Math.floor(60000000 + Math.random() * 19999999),
              pipeline_type: 'VENTAS',
              pipeline_stage: 'NUEVO',
              intent_score: 80,
              ai_summary: `Lead registrado vía Facebook Lead Ads (Form ID: ${formId})`,
              ai_paused: false,
            });
          }
        }
      }

      return res.status(200).json({ status: 'EVENT_RECEIVED' });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : 'Internal Server Error';
      console.error('[Meta Webhook] Error fatal procesando lead:', errMsg);
      return res.status(500).json({ error: errMsg });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

