import { processWebhookMessage } from "../api/whatsapp/webhook";

// Las variables de entorno son inyectadas automáticamente por tsx

async function runTest() {
  console.log("Iniciando prueba local del Webhook de Sofía (End-to-End)...");
  
  const mockPayload = {
    event: "messages.upsert",
    instance: "PropertyOS-Main",
    data: {
      key: {
        remoteJid: "59178756107@s.whatsapp.net", // Usando el número de la captura de pantalla
        fromMe: false,
        id: "TEST_MSG_" + Date.now()
      },
      pushName: "Patty Guti (Test Local)",
      message: {
        conversation: "Hola Sofia, Necesito tambien un departamento en alquiler y una casa en La Paz"
      }
    }
  };

  try {
    const result = await processWebhookMessage(mockPayload, {
      evolutionApiUrl: process.env.EVOLUTION_API_URL,
      evolutionApiKey: process.env.EVOLUTION_API_KEY,
      evolutionInstance: process.env.EVOLUTION_INSTANCE_NAME || "PropertyOS-Main"
    });
    
    console.log("\n✅ [TEST SUCCESS] Resultado del Webhook:");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("\n❌ [TEST ERROR] Hubo un error en el procesamiento:", error);
  }
}

runTest();
