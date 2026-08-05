export async function GET() {
  const checkVar = (val: string | undefined) => {
    if (!val) return "❌ FALTANTE";
    if (val.length < 8) return "⚠️ MUY CORTA";
    return `✅ OK (empieza con ${val.substring(0, 4)}...)`;
  };

  const status = {
    diagnostico: "Si alguna de estas variables críticas está en ❌ FALTANTE, el webhook fallará silenciosamente.",
    variables: {
      EVOLUTION_API_URL: checkVar(process.env.EVOLUTION_API_URL),
      EVOLUTION_API_KEY: checkVar(process.env.EVOLUTION_API_KEY),
      EVOLUTION_INSTANCE_NAME: checkVar(process.env.EVOLUTION_INSTANCE_NAME),
      SUPABASE_SERVICE_ROLE_KEY: checkVar(process.env.SUPABASE_SERVICE_ROLE_KEY),
      OPENAI_API_KEY: checkVar(process.env.OPENAI_API_KEY),
      GEMINI_API_KEY: checkVar(process.env.GEMINI_API_KEY)
    },
    paso_siguiente: "Si todas dicen ✅ OK, el problema está 100% en Evolution API (Railway). Debes activar el toggle 'MESSAGES_UPSERT' en la configuración del Webhook de Evolution."
  };

  return new Response(JSON.stringify(status, null, 2), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
