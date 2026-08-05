import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { GET } from '../src/app/api/whatsapp/test/route';

async function testEndpoint() {
  console.log("Invocando GET de /api/whatsapp/test/route.ts localmente...");
  const res = await GET();
  const text = await res.text();
  console.log("\n=== RESPUESTA DEL ENDPOINT DIAGNÓSTICO ===\n");
  console.log(text);
}

testEndpoint().catch(console.error);
