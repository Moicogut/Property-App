import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. Validación de Handshake GET para Meta Developers
  if (req.method === 'GET') {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const verifyToken = process.env.META_VERIFY_TOKEN;

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
      console.log('📩 Lead recibido de Meta:', JSON.stringify(body, null, 2));

      // Responder de inmediato a Meta para evitar retries (200 OK)
      return res.status(200).json({ status: 'EVENT_RECEIVED' });
    } catch (error) {
      console.error('Error procesando lead de Meta:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
