import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const WEBHOOK_URL = "http://localhost:3000/api/whatsapp/webhook";
const API_KEY = process.env.EVOLUTION_API_KEY || "a2bf8aaaec21a9806766c4a536c75e716d1480feff6f9705697bf626e8fab135";

// Payload simulado de Evolution API
const getPayload = (msgId: string) => ({
  event: "messages.upsert",
  instance: "PropertyOS-Main",
  data: {
    key: {
      remoteJid: "59178756107@s.whatsapp.net",
      fromMe: false,
      id: msgId
    },
    pushName: "Tester Lead",
    message: {
      conversation: "Hola, busco una casa en zona norte"
    }
  }
});

async function runWebhookTest() {
  console.log("🚀 Iniciando prueba E2E Webhook Idempotencia");
  const msgId = `TEST_MSG_${Date.now()}`;
  
  try {
    console.log(`\n1️⃣ Enviando PRIMER POST (msgId: ${msgId})...`);
    
    // Requiere que el server.ts (backend local) esté corriendo en el puerto 3000
    // Por simplicidad en este script, podemos intentar hacer la llamada;
    // Si falla por ECONNREFUSED, advertimos que deben levantar el dev server.
    const res1 = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "apikey": API_KEY
      },
      body: JSON.stringify(getPayload(msgId))
    });

    const data1 = await res1.json();
    console.log(`Estado HTTP: ${res1.status}`);
    console.log("Respuesta 1:", data1);

    if (res1.status !== 200 || data1.status === "DUPLICATE_IGNORED") {
      throw new Error("El primer envío no debería ser ignorado ni fallar.");
    }

    console.log("\n2️⃣ Enviando SEGUNDO POST idéntico inmediatamente (esperando DUPLICATE_IGNORED)...");
    const res2 = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "apikey": API_KEY
      },
      body: JSON.stringify(getPayload(msgId))
    });

    const data2 = await res2.json();
    console.log(`Estado HTTP: ${res2.status}`);
    console.log("Respuesta 2:", data2);

    if (res2.status !== 200 || data2.status !== "DUPLICATE_IGNORED") {
      throw new Error(`Test fallido. Esperado status 'DUPLICATE_IGNORED', obtenido: ${data2.status}`);
    }

    console.log("\n✅ Test de Idempotencia del Webhook Superado con éxito.");

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (errorMsg.includes("fetch failed")) {
      console.log("⚠️ Asegúrate de correr 'npm run dev' en otra terminal para que el endpoint :3000 responda.");
    } else {
      console.error("❌ FAILED E2E Webhook Test:", errorMsg);
    }
    process.exit(1);
  }
}

runWebhookTest();
