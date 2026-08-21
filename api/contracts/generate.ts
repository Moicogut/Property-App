import { VercelRequest, VercelResponse } from '@vercel/node';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || 'https://lqagnlbygzurddkzbbwn.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
const supabaseServer = createClient(supabaseUrl, supabaseKey);

// Sanitizador estricto para fuentes estándar Helvetica en PDF (WinAnsi / ASCII)
const sanitizeText = (str: string | number | undefined | null): string => {
  if (str === undefined || str === null) return '';
  return String(str)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Elimina tildes (á -> a, é -> e)
    .replace(/ñ/g, 'n')
    .replace(/Ñ/g, 'N')
    .replace(/[^\x20-\x7E\n]/g, ' ') // Caracteres no imprimibles
    .trim();
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      lead_id, 
      property_id, 
      contract_type = 'RESERVATION', 
      buyer_name, 
      buyer_id_number, 
      agreed_price, 
      reservation_amount = 0, 
      valid_until 
    } = req.body;

    if (!property_id || !buyer_name || !buyer_id_number || agreed_price === undefined) {
      return res.status(400).json({ error: 'Faltan campos obligatorios para emitir el contrato.' });
    }

    // 1. Obtener organización
    const { data: orgs } = await supabaseServer.from("organizations").select("id, name").limit(1);
    const orgId = orgs?.[0]?.id || null;
    const orgName = orgs?.[0]?.name || "PROPERTY OS INMOBILIARIA";

    // 2. Obtener datos de la propiedad
    const { data: property, error: propError } = await supabaseServer
      .from('properties')
      .select('*')
      .eq('id', property_id)
      .single();

    if (propError || !property) {
      return res.status(404).json({ error: 'Propiedad no encontrada en la base de datos.' });
    }

    const contractCode = `CTR-${Date.now().toString().slice(-6)}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const emissionDate = new Date().toLocaleDateString('es-BO', { year: 'numeric', month: 'long', day: 'numeric' });
    const validityDate = valid_until 
      ? new Date(valid_until).toLocaleDateString('es-BO', { year: 'numeric', month: 'long', day: 'numeric' })
      : new Date(Date.now() + 15 * 86400000).toLocaleDateString('es-BO', { year: 'numeric', month: 'long', day: 'numeric' });

    // 3. Generación del Documento PDF
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 Standard (Points)
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const margin = 45;
    const pageWidth = page.getWidth();
    let y = page.getHeight() - margin;

    // Encabezado Corporativo
    page.drawRectangle({
      x: margin,
      y: y - 8,
      width: pageWidth - (margin * 2),
      height: 38,
      color: rgb(0.06, 0.09, 0.16), // Slate 900
    });

    page.drawText(sanitizeText(orgName.toUpperCase()), {
      x: margin + 12,
      y: y + 14,
      size: 13,
      font: fontBold,
      color: rgb(0.06, 0.73, 0.51), // Emerald 500
    });

    page.drawText(`COD: ${contractCode}`, {
      x: pageWidth - margin - 130,
      y: y + 14,
      size: 10,
      font: fontBold,
      color: rgb(0.9, 0.9, 0.9),
    });

    y -= 50;

    // Título del Documento
    const titleText = contract_type === 'RESERVATION'
      ? 'DOCUMENTO DE RESERVA FORMAL Y SENAL DE TRATO'
      : contract_type === 'CONSIGNATION'
      ? 'CONTRATO DE CONSIGNACION Y MANDATO DE VENTA'
      : 'PROMESA BILATERAL DE COMPRAVENTA DE INMUEBLE';

    page.drawText(sanitizeText(titleText), {
      x: margin,
      y,
      size: 13,
      font: fontBold,
      color: rgb(0.08, 0.12, 0.2),
    });

    y -= 14;
    page.drawText(`Fecha de Emision: ${sanitizeText(emissionDate)} | Estado Plurinacional de Bolivia`, {
      x: margin,
      y,
      size: 9,
      font,
      color: rgb(0.4, 0.45, 0.5),
    });

    y -= 25;

    // Sección 1: Comparecientes
    page.drawRectangle({
      x: margin,
      y: y - 4,
      width: pageWidth - (margin * 2),
      height: 18,
      color: rgb(0.94, 0.96, 0.98),
    });
    page.drawText('I. COMPARECIENTES Y PARTES INTERVINIENTES', {
      x: margin + 8,
      y,
      size: 9.5,
      font: fontBold,
      color: rgb(0.1, 0.2, 0.3),
    });

    y -= 20;
    const drawField = (label: string, value: string, offset = 140) => {
      page.drawText(`${sanitizeText(label)}:`, { x: margin + 8, y, size: 9, font: fontBold, color: rgb(0.2, 0.25, 0.3) });
      page.drawText(sanitizeText(value), { x: margin + offset, y, size: 9, font, color: rgb(0.1, 0.1, 0.1) });
      y -= 15;
    };

    drawField('Parte Interesada', buyer_name);
    drawField('Documento de Identidad (CI/NIT)', buyer_id_number);
    drawField('Agencia / Asesor Autorizado', `${orgName} (Representacion Inmobiliaria)`);

    y -= 10;

    // Sección 2: Objeto del Inmueble
    page.drawRectangle({
      x: margin,
      y: y - 4,
      width: pageWidth - (margin * 2),
      height: 18,
      color: rgb(0.94, 0.96, 0.98),
    });
    page.drawText('II. IDENTIFICACION DEL INMUEBLE MATERIA DEL CONTRATO', {
      x: margin + 8,
      y,
      size: 9.5,
      font: fontBold,
      color: rgb(0.1, 0.2, 0.3),
    });

    y -= 20;
    drawField('Denominacion Inmueble', property.title || 'Propiedad Residencial');
    drawField('Ubicacion Geografica', `${property.zone || 'Centro'}, ${property.city || 'Santa Cruz'}`);
    drawField('Superficie Util', `${property.area_sqm || 0} m2 (${property.bedrooms || 0} Dormitorios / ${property.bathrooms || 0} Banos)`);
    drawField('Calificacion Financiera', property.accepts_social_housing ? 'Compatible con Credito de Vivienda Social (ASFI VIS)' : 'Venta Libre Bancaria / Contado');

    y -= 10;

    // Sección 3: Condiciones Económicas
    page.drawRectangle({
      x: margin,
      y: y - 4,
      width: pageWidth - (margin * 2),
      height: 18,
      color: rgb(0.94, 0.96, 0.98),
    });
    page.drawText('III. CONDICIONES ECONOMICAS Y TERMINOS DE PAGO', {
      x: margin + 8,
      y,
      size: 9.5,
      font: fontBold,
      color: rgb(0.1, 0.2, 0.3),
    });

    y -= 20;
    const priceUsdNum = Number(agreed_price) || 0;
    const priceBs = (priceUsdNum * 6.96).toLocaleString('es-BO', { minimumFractionDigits: 2 });
    drawField('Precio Total Convenido', `$${priceUsdNum.toLocaleString('en-US')} USD (Equivalente referencial: Bs. ${priceBs})`);
    
    if (contract_type === 'RESERVATION') {
      const resAmountNum = Number(reservation_amount) || 0;
      drawField('Monto de Reserva / Senal', `$${resAmountNum.toLocaleString('en-US')} USD`);
      drawField('Vigencia de la Reserva', `Hasta el ${validityDate}`);
    }

    y -= 12;

    // Sección 4: Cláusulas y Condiciones Legales
    page.drawRectangle({
      x: margin,
      y: y - 4,
      width: pageWidth - (margin * 2),
      height: 18,
      color: rgb(0.94, 0.96, 0.98),
    });
    page.drawText('IV. CLAUSULAS CONTRACTUALES Y DISPOSICIONES LEGALES', {
      x: margin + 8,
      y,
      size: 9.5,
      font: fontBold,
      color: rgb(0.1, 0.2, 0.3),
    });

    y -= 18;

    const clauses = contract_type === 'RESERVATION'
      ? [
          'PRIMERA (COMPROMISO DE RETIRO): La parte vendedora se compromete a retirar de forma inmediata el inmueble de la oferta publica durante el plazo de vigencia estipulado.',
          'SEGUNDA (IMPUTACION AL PRECIO): El monto entregado en calidad de reserva sera imputado en su totalidad al precio final pactado al momento de suscribir la minuta de transferencia definitiva.',
          'TERCERA (JURISDICCION): Las partes se someten a la normativa del Codigo Civil Boliviano en materia de obligaciones y arras confirmatorias, fijando domicilio legal en la ciudad de origen del inmueble.',
        ]
      : [
          'PRIMERA (CONFORMIDAD): Las partes declaran libre y expresamente su conformidad con el estado actual del inmueble, sus gravamenes declarados y superficie catastral.',
          'SEGUNDA (FORMA DE PAGO): El saldo deudor sera cancelado mediante desembolso bancario o transferencia interbancaria autorizada al momento del perfeccionamiento notarial.',
          'TERCERA (PENALIDADES): En caso de desistimiento injustificado, las partes se sujetan a la aplicacion de las penalidades establecidas en el Codigo Civil Boliviano.',
        ];

    for (const clause of clauses) {
      page.drawText(sanitizeText(clause), {
        x: margin + 8,
        y,
        size: 8,
        font,
        color: rgb(0.2, 0.25, 0.3),
      });
      y -= 14;
    }

    // Cuadro de Firmas
    y -= 45;
    const signY = y;
    page.drawLine({
      start: { x: margin + 20, y: signY },
      end: { x: margin + 200, y: signY },
      thickness: 1,
      color: rgb(0.3, 0.35, 0.4),
    });

    page.drawText('FIRMA DEL COMPRADOR / INTERESADO', {
      x: margin + 25,
      y: signY - 14,
      size: 8,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2),
    });
    page.drawText(`CI: ${sanitizeText(buyer_id_number)}`, {
      x: margin + 25,
      y: signY - 26,
      size: 7.5,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });

    page.drawLine({
      start: { x: pageWidth - margin - 200, y: signY },
      end: { x: pageWidth - margin - 20, y: signY },
      thickness: 1,
      color: rgb(0.3, 0.35, 0.4),
    });

    page.drawText('FIRMA ASESOR / INMOBILIARIA', {
      x: pageWidth - margin - 185,
      y: signY - 14,
      size: 8,
      font: fontBold,
      color: rgb(0.2, 0.2, 0.2),
    });
    page.drawText(sanitizeText(orgName), {
      x: pageWidth - margin - 185,
      y: signY - 26,
      size: 7.5,
      font,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Guardar PDF en bytes
    const pdfBytes = await pdfDoc.save();

    // 4. Subida a Supabase Storage con Fallback a Data URI
    let pdfUrl = "";
    const fileName = `contrato_${lead_id || 'lead'}_${contractCode}.pdf`;

    try {
      const { error: uploadError } = await supabaseServer
        .storage
        .from('contracts-pdf')
        .upload(fileName, pdfBytes, {
          contentType: 'application/pdf',
          upsert: true
        });

      if (!uploadError) {
        const { data: publicUrlData } = supabaseServer
          .storage
          .from('contracts-pdf')
          .getPublicUrl(fileName);
        
        pdfUrl = publicUrlData?.publicUrl || "";
      }
    } catch (storageErr) {
      console.warn("[PDF] Storage upload warning:", storageErr);
    }

    // Si storage no devuelve URL pública, generar base64 Data URI
    if (!pdfUrl) {
      const base64Pdf = Buffer.from(pdfBytes).toString('base64');
      pdfUrl = `data:application/pdf;base64,${base64Pdf}`;
    }

    // 5. Registrar en tabla `contracts`
    let contractRecord = null;
    try {
      const { data: inserted, error: dbError } = await supabaseServer
        .from('contracts')
        .insert({
          organization_id: orgId,
          lead_id: lead_id || null,
          property_id,
          contract_type,
          buyer_name,
          buyer_id_number,
          agreed_price,
          reservation_amount,
          valid_until: valid_until || null,
          pdf_url: pdfUrl.startsWith('data:') ? 'base64://embedded' : pdfUrl
        })
        .select()
        .single();

      if (!dbError) {
        contractRecord = inserted;
      }
    } catch (dbErr) {
      console.warn("[PDF] DB log warning:", dbErr);
    }

    return res.status(200).json({ 
      success: true, 
      pdf_url: pdfUrl, 
      contract_code: contractCode,
      contract: contractRecord 
    });

  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : "Error interno al generar el PDF";
    console.error("[Contracts] Error fatal:", errorMsg);
    return res.status(500).json({ error: errorMsg });
  }
}

