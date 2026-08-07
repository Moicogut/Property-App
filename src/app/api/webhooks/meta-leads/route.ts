import { NextResponse } from "next/server";
import { supabaseServer } from "@/src/lib/supabase-server";

// Validar el Webhook de Facebook (Hub Challenge)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  const verifyToken = process.env.META_VERIFY_TOKEN;

  if (mode && token) {
    if (mode === "subscribe" && token === verifyToken) {
      console.log("WEBHOOK_VERIFIED");
      return new NextResponse(challenge, { status: 200 });
    } else {
      return NextResponse.json({ error: "Verification failed" }, { status: 403 });
    }
  }

  return NextResponse.json({ error: "Invalid request" }, { status: 400 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.object !== "page") {
      return NextResponse.json({ error: "Not a page event" }, { status: 404 });
    }

    const { data: orgs } = await supabaseServer.from("organizations").select("id").limit(1);
    const orgId = orgs?.[0]?.id || "org-1";

    for (const entry of body.entry) {
      if (!entry.changes) continue;
      for (const webhookEvent of entry.changes) {
        if (webhookEvent.field === "leadgen") {
          const leadgenId = webhookEvent.value.leadgen_id;
          
          await supabaseServer.from("leads").insert({
            organization_id: orgId,
            phone_number: `FB-${leadgenId}`, // Placeholder
            full_name: `Facebook Lead ${leadgenId}`,
            pipeline_stage: "NUEVO",
            source_channel: "facebook_ads",
            ai_paused: false,
          });
        }
      }
    }

    return NextResponse.json({ status: "success" }, { status: 200 });
  } catch (error) {
    console.error("[Meta Webhook] Error processing event:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
