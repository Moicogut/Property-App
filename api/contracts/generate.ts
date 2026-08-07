import { VercelRequest, VercelResponse } from '@vercel/node';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabaseServer = createClient(supabaseUrl, supabaseKey);

const sanitizeText = (str: string) => 
  str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ñ/g, "n").replace(/Ñ/g, "N") : "";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      lead_id, 
      property_id, 
      contract_type, 
      buyer_name, 
      buyer_id_number, 
      agreed_price, 
      reservation_amount, 
      valid_until 
    } = req.body;

    if (!lead_id || !property_id || !buyer_name || !buyer_id_number || !agreed_price) {
      return res.status(400).json({ error: 'Faltan campos requeridos.' });
    }

    // 1. Obtener la organización (simplificado)
    const { data: orgs } = await supabaseServer.from("organizations").select("id").limit(1);
    const orgId = orgs?.[0]?.id || null;

    // 2. Obtener datos de la propiedad
    const { data: property, error: propError } = await supabaseServer
      .from('properties')
      .select('*')
      .eq('id', property_id)
      .single();

    if (propError || !property) {
      return res.status(404).json({ error: 'Propiedad no encontrada.' });
    }

    // 3. Generar el PDF con pdf-lib
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const margin = 50;
    let y = page.getHeight() - margin;

    // Membrete
    page.drawText('PROPERTY OS - CONTRATO DIGITAL', { x: margin, y, size: 20, font: fontBold, color: rgb(0, 0.5, 0.3) });
    y -= 40;

    const titleStr = contract_type === 'RESERVATION' ? 'DOCUMENTO DE RESERVA DE INMUEBLE' : 'PROMESA DE COMPRAVENTA';
    page.drawText(titleStr, { x: margin, y, size: 16, font: fontBold });
    y -= 30;

    // Cuerpo
    const drawLine = (label: string, value: string) => {
      page.drawText(`${label}:`, { x: margin, y, size: 12, font: fontBold });
      page.drawText(sanitizeText(value), { x: margin + 120, y, size: 12, font });
      y -= 20;
    };

    drawLine('Comprador', buyer_name);
    drawLine('Identificación', buyer_id_number);
    y -= 10;
    drawLine('Propiedad', property.title || '');
    drawLine('Ubicación', `${property.zone}, ${property.city}`);
    y -= 10;
    drawLine('Precio Acordado', `$${agreed_price} USD`);
    drawLine('Monto Reserva', `$${reservation_amount} USD`);
    drawLine('Válido Hasta', valid_until ? new Date(valid_until).toLocaleDateString() : 'N/A');

    y -= 40;
    page.drawText('Clausulas Legales:', { x: margin, y, size: 12, font: fontBold });
    y -= 20;
    
    const clausulas = contract_type === 'RESERVATION' 
      ? `El comprador entrega la suma de $${reservation_amount} USD como reserva formal del inmueble.\nEl vendedor se compromete a retirar la propiedad del mercado hasta la fecha ${valid_until || 'pactada'}.`
      : `Por el presente contrato de promesa de compraventa, las partes acuerdan el precio de $${agreed_price} USD.\nLas penalidades por incumplimiento se rigen bajo la ley vigente.`;

    const clausulasLines = clausulas.split('\n');
    for (const line of clausulasLines) {
      page.drawText(sanitizeText(line), { x: margin, y, size: 10, font });
      y -= 15;
    }

    y -= 80;
    page.drawText('_________________________', { x: margin, y, size: 12, font: fontBold });
    page.drawText('Firma Comprador', { x: margin + 20, y: y - 15, size: 10, font });

    page.drawText('_________________________', { x: margin + 250, y, size: 12, font: fontBold });
    page.drawText('Firma Vendedor / Agente', { x: margin + 250 + 10, y: y - 15, size: 10, font });

    // Guardar PDF en bytes
    const pdfBytes = await pdfDoc.save();

    // 4. Subir a Supabase Storage
    const fileName = `contrato_${lead_id}_${crypto.randomBytes(4).toString('hex')}.pdf`;
    const { data: uploadData, error: uploadError } = await supabaseServer
      .storage
      .from('contracts-pdf')
      .upload(fileName, pdfBytes, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('[PDF] Upload Error:', uploadError);
      return res.status(500).json({ error: 'Error al subir el archivo PDF a Storage.' });
    }

    const { data: publicUrlData } = supabaseServer
      .storage
      .from('contracts-pdf')
      .getPublicUrl(fileName);

    const pdfUrl = publicUrlData.publicUrl;

    // 5. Registrar en BD
    const { data: contractRecord, error: dbError } = await supabaseServer
      .from('contracts')
      .insert({
        organization_id: orgId,
        lead_id,
        property_id,
        contract_type,
        buyer_name,
        buyer_id_number,
        agreed_price,
        reservation_amount,
        valid_until: valid_until || null,
        pdf_url: pdfUrl
      })
      .select()
      .single();

    if (dbError) {
      console.error('[PDF] BD Error:', dbError);
      return res.status(500).json({ error: 'Error al registrar el contrato en BD.' });
    }

    return res.status(200).json({ success: true, pdf_url: pdfUrl, contract: contractRecord });
  } catch (error: any) {
    console.error("Error al generar contrato:", error);
    return res.status(500).json({ error: error.message || "Error interno al generar el PDF" });
  }
}
