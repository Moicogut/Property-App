import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
import { GoogleGenAI } from "@google/genai";

async function checkModels() {
  const client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  // El SDK no expone ListModels fácilmente, probaremos llamando al REST API directo o probando embedding-001
  try {
    const res = await client.models.embedContent({ model: "embedding-001", contents: "test" });
    console.log("embedding-001 O.K.", res.embeddings?.[0].values?.length);
  } catch(e) {
    console.error("Error embedding-001", e);
  }
}
checkModels();
