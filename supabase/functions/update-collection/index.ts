import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "PUT, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "PUT") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(
      JSON.stringify({ error: "Missing Authorization header" }),
      { status: 401, headers: corsHeaders },
    );
  }

  const jwt = authHeader.replace("Bearer ", "");
  function parseJwt(token: string) {
    try {
      return JSON.parse(atob(token.split(".")[1]));
    } catch {
      return null;
    }
  }

  const payload = parseJwt(jwt);
  const user_id = payload?.sub;
  if (!user_id) {
    return new Response(
      JSON.stringify({ error: "Invalid JWT" }),
      { status: 401, headers: corsHeaders },
    );
  }

  try {
    const { id, name, description, tags } = await req.json();

    if (!id) {
      return new Response(
        JSON.stringify({ error: "Collection ID is required" }),
        { status: 400, headers: corsHeaders },
      );
    }

    if (!name || name.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "Collection name is required" }),
        { status: 400, headers: corsHeaders },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // First check if collection exists and belongs to user
    const { data: existingCollection, error: fetchError } = await supabase
      .from("collections")
      .select("id")
      .eq("id", id)
      .eq("user_id", user_id)
      .single();

    if (fetchError || !existingCollection) {
      return new Response(
        JSON.stringify({ error: "Collection not found or access denied" }),
        { status: 404, headers: corsHeaders },
      );
    }

    // Update the collection
    const { data, error } = await supabase
      .from("collections")
      .update({
        name: name.trim(),
        description: description?.trim() || null,
        tags: tags || [],
        updated_date: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user_id)
      .select()
      .single();

    if (error) {
      console.error("Error updating collection:", error);
      return new Response(
        JSON.stringify({ error: "Failed to update collection" }),
        { status: 500, headers: corsHeaders },
      );
    }

    return new Response(JSON.stringify(data), { headers: corsHeaders });
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: corsHeaders },
    );
  }
});
