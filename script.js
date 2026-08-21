const script = [
  {
    scene_number: 1,
    image_prompt: "Cinematic vertical 9:16 portrait, a sharp 33-year-old latino male real estate advisor with neat short dark hair, wearing an impeccably tailored obsidian black suit, ivory shirt and a subtle gold lapel pin, holding a sleek glass tablet displaying a glowing real estate mortgage chart, modern penthouse background with warm city bokeh, 5600K diffused key lighting with champagne gold edge light, hyperrealistic 8k, award winning photography.",
    video_prompt: "Camera performs a slow cinematic push-in towards the 33-year-old advisor in tailored black suit as he smiles confidently and taps the glass tablet screen showing a 5.5 percent mortgage calculation, luxury penthouse office background, smooth 24fps movement, 5600K lighting.",
    narration: "Si sigues creyendo que necesitas cincuenta mil dólares para comprar tu primer departamento en Bolivia, estás perdiendo dinero. Con el Crédito de Vivienda Social VIS, la tasa de interés está fijada al 5.5% regulada por ley. Eso significa que por un departamento de 48,000 dólares, tu cuota mensual queda en solo 285 dólares... exactamente lo que hoy pagas de alquiler. Comenta la palabra CALCULAR abajo y te envío el simulador oficial a tu WhatsApp."
  },
  {
    scene_number: 2,
    image_prompt: "Cinematic vertical 9:16 shot, luxury modern office at 2:30 AM with dark ambient night aesthetic, glowing neon accents, 33-year-old advisor sleeping peacefully in a leather chair while in the foreground a smartphone on the desk illuminates showing an automated WhatsApp AI assistant Sofia closing a real estate appointment, photorealistic, 8k resolution.",
    video_prompt: "Slow camera pan from the peaceful advisor in suit to the glowing smartphone on the desk, displaying incoming WhatsApp messages where Sofia AI automatically qualifies the buyer's budget and books a visit in Google Calendar, cinematic lighting, 24fps.",
    narration: "Son las dos y media de la madrugada y acabo de calificar a un comprador listo para firmar minuta. Mientras descansas, nuestra asistente Sofía IA atiende a tus clientes en WhatsApp, califica su presupuesto con telemetría BANT y te agenda la visita en Google Calendar. Comenta BOT para probar el simulador gratis."
  },
  {
    scene_number: 3,
    image_prompt: "Cinematic vertical 9:16 shot, close-up of a high-tech transparent screen showing a green real estate legal audit shield with three verified checks for Folio Real, Municipal Taxes, and Approved Cadastre, the 33-year-old male advisor in black suit standing behind with a professional trustworthy look, warm champagne gold lighting accents, 8k.",
    video_prompt: "Camera zooms slightly into the digital legal audit interface as three green verification checkmarks light up in sequence for Folio Real, Taxes, and Cadastre, while the advisor points to the screen with confidence, cinematic depth of field, 24fps.",
    narration: "Nunca des un centavo de reserva por un inmueble sin antes revisar este semáforo legal. En Bolivia, 4 de cada 10 inmuebles tienen problemas en Derechos Reales: hipotecas no canceladas, deudas en el RUAT o planos no visados. En Property OS auditamos los 3 pilares legales antes de emitir cualquier contrato. Comenta AUDITORIA para evaluar tu caso."
  },
  {
    scene_number: 4,
    image_prompt: "Cinematic vertical 9:16 medium shot, 33-year-old real estate advisor standing beside an architectural model of a modern apartment tower in Santa Cruz, reviewing an analytical real estate valuation heatmap on a tablet, elegant obsidian interior design with gold highlights, 8k.",
    video_prompt: "Gentle camera orbit around the advisor as he examines the architectural scale model, comparing market square meter values on his tablet with smooth gestures, modern luxury aesthetic, 24fps.",
    narration: "¿Tu casa lleva 6 meses en venta y nadie llama? Este es el motivo exacto: el precio por metro cuadrado está desalineado del mercado real. Con nuestro estudio comparativo ACM analizamos la zona exacta para que vendas al mejor valor sin quemar tu propiedad. Comenta PRECIO y valuamos tu inmueble."
  },
  {
    scene_number: 5,
    image_prompt: "Cinematic vertical 9:16 split screen concept, on the left an exhausted real estate agent buried under messy paper folders, on the right the sharp 33-year-old advisor in black suit operating Property OS on a single lightweight laptop with automated CRM pipelines, high contrast lighting, 8k.",
    video_prompt: "Dynamic split comparison transitioning into a full shot of the modern advisor effortlessly generating a digital PDF reservation contract with one click on Property OS, sleek UI glow, cinematic 24fps.",
    narration: "El 90% de los agentes inmobiliarios perderá clientes este año por seguir usando hojas de cálculo y notas en papel. Property OS es el sistema operativo completo con contratos en PDF, cotizador bancario y pipeline automatizado. Si quieres usar esta tecnología o unirte a nuestro equipo de embajadores, comenta SISTEMA."
  },
  {
    scene_number: 6,
    image_prompt: "Cinematic vertical 9:16 wide shot, beautiful bright modern living room with floor-to-ceiling glass windows, sunny natural light illuminating an open-concept kitchen with quartz countertops, the 33-year-old male advisor in black suit gesturing welcomingly towards the balcony, architectural photography quality, 8k.",
    video_prompt: "Smooth forward tracking shot walking into the luxurious 65,000-dollar apartment, showing the spacious living room, modern kitchen, and panoramic balcony view with soft sun flare, 24fps.",
    narration: "Te muestro este departamento de 65,000 dólares en la mejor zona residencial. Dos dormitorios, cocina equipada y balcón panorámico, apto para crédito VIS con cuota bancaria súper accesible. Comenta TOUR y te paso la ficha técnica completa con ubicación exacta."
  },
  {
    scene_number: 7,
    image_prompt: "Cinematic vertical 9:16 portrait, the 33-year-old advisor sitting comfortably in a modern leather armchair holding a coffee cup, looking genuinely into the camera with an engaging, approachable expression, warm ambient lighting in a premium executive lounge, 8k.",
    video_prompt: "Close-up conversational camera angle as the advisor addresses the audience directly with authentic micro-expressions and gestures, warm atmospheric lighting, 24fps.",
    narration: "Muchas personas me preguntan cuál es el mayor freno para comprar casa este 2026: ¿el aporte inicial o el miedo a las tasas? La clave no es esperar el momento perfecto, sino estructurar tu financiamiento con datos reales. Escríbeme un mensaje directo con tu caso y te asesoramos paso a paso."
  }
];

if (typeof module !== 'undefined') {
  module.exports = script;
}
if (typeof window !== 'undefined') {
  window.script = script;
}
