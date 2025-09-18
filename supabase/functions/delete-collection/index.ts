import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "DELETE, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "DELETE") {
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
    const url = new URL(req.url);
    const collectionId = url.searchParams.get("id");

    if (!collectionId) {
      return new Response(
        JSON.stringify({ error: "Collection ID is required" }),
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
      .select("id, name")
      .eq("id", collectionId)
      .eq("user_id", user_id)
      .single();

    if (fetchError || !existingCollection) {
      return new Response(
        JSON.stringify({ error: "Collection not found or access denied" }),
        { status: 404, headers: corsHeaders },
      );
    }

    // Delete collection_resources relationships first (if they exist)
    const { error: deleteResourcesError } = await supabase
      .from("collection_resources")
      .delete()
      .eq("collection_id", collectionId);

    if (deleteResourcesError) {
      console.error(
        "Error deleting collection resources:",
        deleteResourcesError,
      );
      // We continue even if this fails, as the collection_resources might not exist
    }

    // Delete the collection
    const { error } = await supabase
      .from("collections")
      .delete()
      .eq("id", collectionId)
      .eq("user_id", user_id);

    if (error) {
      console.error("Error deleting collection:", error);
      return new Response(
        JSON.stringify({ error: "Failed to delete collection" }),
        { status: 500, headers: corsHeaders },
      );
    }

    return new Response(
      JSON.stringify({
        message: "Collection deleted successfully",
        deletedCollection: existingCollection,
      }),
      { headers: corsHeaders },
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: corsHeaders },
    );
  }
});
