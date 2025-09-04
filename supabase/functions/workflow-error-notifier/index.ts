import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface WorkflowErrorPayload {
  user_id?: string;
  workflow_execution_id?: string;
  workflow_name: string;
  error_message: string;
  error_node?: string;
  error_data?: Record<string, any>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: corsHeaders },
    );
  }

  try {
    // Initialize Supabase client with service role
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );

    // Parse request body
    const payload: WorkflowErrorPayload = await req.json();

    // Validate required fields
    if (!payload.workflow_name || !payload.error_message) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: workflow_name, error_message",
        }),
        { status: 400, headers: corsHeaders },
      );
    }

    // If user_id not provided, try to extract from workflow_execution_id by looking up the job that has this workflow_execution_id
    let userId = payload.user_id;

    if (!userId && payload.workflow_execution_id) {
      const { data: job } = await supabaseClient
        .from("jobs")
        .select("user_id")
        .eq("workflow_execution_id", payload.workflow_execution_id)
        .single();

      if (job) {
        userId = job.user_id;
      }
    }

    if (!userId) {
      return new Response(
        JSON.stringify({
          error: "Could not determine user_id for workflow error notification",
        }),
        { status: 400, headers: corsHeaders },
      );
    }

    // Insert workflow error record
    const { data: workflowError, error: insertError } = await supabaseClient
      .from("workflow_errors")
      .insert({
        user_id: userId,
        workflow_execution_id: payload.workflow_execution_id,
        workflow_name: payload.workflow_name,
        error_message: payload.error_message,
        error_node: payload.error_node,
        error_data: payload.error_data || {},
        created_at: new Date().toISOString(),
        notified_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error inserting workflow error:", insertError);
      return new Response(
        JSON.stringify({
          error: "Failed to log workflow error",
          details: insertError.message,
        }),
        { status: 500, headers: corsHeaders },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        workflow_error: workflowError,
      }),
      { status: 200, headers: corsHeaders },
    );
  } catch (error) {
    console.error("Unexpected error in workflow-error-notifier:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message: error.message,
      }),
      { status: 500, headers: corsHeaders },
    );
  }
});
