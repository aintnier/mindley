// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs

import "jsr:@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Auth
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing Authorization header" }), { status: 401, headers: corsHeaders });
  }
  const jwt = authHeader.replace("Bearer ", "");
  function parseJwt(token: string) {
    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }
  const payload = parseJwt(jwt);
  const user_id = payload?.sub;
  if (!user_id) {
    return new Response(JSON.stringify({ error: "Invalid JWT" }), { status: 401, headers: corsHeaders });
  }

  // Input
  let body: { link: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400, headers: corsHeaders });
  }
  if (!body.link) {
    return new Response(JSON.stringify({ error: "Missing link" }), { status: 400, headers: corsHeaders });
  }

  // Inoltra a n8n (webhook pubblico EC2)
  const n8nWebhookUrl = "http://51.21.76.114:5678/webhook/72fdabf2-3d1c-4534-9b18-b1e04f70db87";
  const n8nPayload = { link: body.link, user_id };
  let n8nRes;
  try {
    n8nRes = await fetch(n8nWebhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(n8nPayload),
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: "Failed to contact workflow" }), { status: 502, headers: corsHeaders });
  }

  if (!n8nRes.ok) {
    return new Response(JSON.stringify({ error: "Workflow error", status: n8nRes.status }), { status: 502, headers: corsHeaders });
  }

  // Risposta immediata (il salvataggio su resources avverrà da n8n)
  return new Response(JSON.stringify({ success: true }), { status: 202, headers: corsHeaders });
});

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/create-resource' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
