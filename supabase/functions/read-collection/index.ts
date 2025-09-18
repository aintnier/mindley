import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "GET") {
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
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const url = new URL(req.url);
    const collectionId = url.searchParams.get("id");

    if (collectionId) {
      // Get single collection with resource count
      const { data: collection, error } = await supabase
        .from("collections")
        .select(`
          *,
          collection_resources(count)
        `)
        .eq("id", collectionId)
        .eq("user_id", user_id)
        .single();

      if (error) {
        console.error("Error fetching collection:", error);
        return new Response(
          JSON.stringify({ error: "Collection not found" }),
          { status: 404, headers: corsHeaders },
        );
      }

      // Calculate resource count
      const resourceCount = collection.collection_resources?.[0]?.count || 0;
      delete collection.collection_resources;

      return new Response(
        JSON.stringify({ ...collection, resource_count: resourceCount }),
        { headers: corsHeaders },
      );
    } else {
      // Get all collections for user with resource counts
      const { data: collections, error } = await supabase
        .from("collections")
        .select(`
          *,
          collection_resources(count)
        `)
        .eq("user_id", user_id)
        .order("created_date", { ascending: false });

      if (error) {
        console.error("Error fetching collections:", error);
        return new Response(
          JSON.stringify({ error: "Failed to fetch collections" }),
          { status: 500, headers: corsHeaders },
        );
      }

      // Process collections to include resource counts
      const processedCollections = collections.map((collection) => {
        const resourceCount = collection.collection_resources?.[0]?.count || 0;
        delete collection.collection_resources;
        return { ...collection, resource_count: resourceCount };
      });

      return new Response(
        JSON.stringify(processedCollections),
        { headers: corsHeaders },
      );
    }
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: corsHeaders },
    );
  }
});
