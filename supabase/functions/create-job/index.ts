// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

interface CreateJobRequest {
  workflow_name: string
  resource_id?: number
  workflow_execution_id?: string
  metadata?: Record<string, any>
  user_id?: string // UUID expected when using service role (n8n)
  user_email?: string // Alternative lookup if user_id not provided
  steps: Array<{
    step_name: string
    step_type: string
    step_order: number
    metadata?: Record<string, any>
  }>
}

// Align with DB enums: job_status (pending, running, completed, failed, cancelled) and job_step_status (pending, running, completed, failed, skipped)
type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled'
type StepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped'

function isServiceRoleToken(token: string): boolean {
  try {
    const payloadPart = token.split('.')[1]
    if (!payloadPart) return false
    const json = atob(payloadPart)
    const payload = JSON.parse(json)
    return payload.role === 'service_role'
  } catch {
    return false
  }
}

function isUuid(value: string | undefined): boolean {
  if (!value) return false
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

console.log("Create Job Function started")

Deno.serve(async (req) => {
  try {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    }

    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    // Get authorization header
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if it's service role key (from n8n) or user JWT (from frontend)
    const token = authHeader.replace('Bearer ', '')
    
    // Decode the JWT to check the role
  const isServiceRole = isServiceRoleToken(token)
    
    // Parse the request body ONCE here
    const requestBody: CreateJobRequest = await req.json()
    
  let supabaseClient;
  let userId: string | undefined;
    
    if (isServiceRole) {
      // n8n call with service role key
      supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );

      // For n8n calls, get user_id from request body
      userId = requestBody.user_id

      // If user_id not provided or invalid UUID, but user_email is provided, resolve it
      if ((!userId || !isUuid(userId)) && requestBody.user_email) {
        const { data: userLookup, error: userLookupError } = await supabaseClient.auth.admin.getUserByEmail(requestBody.user_email)
        if (userLookupError || !userLookup?.user) {
          return new Response(
            JSON.stringify({ error: 'Unable to resolve user by email' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          )
        }
        userId = userLookup.user.id
      }

      if (!userId || !isUuid(userId)) {
        return new Response(
          JSON.stringify({ error: 'Valid user_id (UUID) or user_email required for n8n calls' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
    } else {
      // Frontend call with user JWT
      supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        {
          global: {
            headers: { Authorization: authHeader },
          },
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );

      // Get user from JWT
      const { data: { user }, error: userError } = await supabaseClient.auth.getUser()
      
      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: 'Invalid authorization token' }),
          { 
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
      
      userId = user.id
    }

    // Use the already parsed request body
    const { 
      workflow_name, 
      resource_id, 
      workflow_execution_id,
      metadata, 
      steps 
    } = requestBody

    if (!workflow_name || !steps || steps.length === 0) {
      return new Response(
        JSON.stringify({ error: 'workflow_name and steps are required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create the job
    const { data: job, error: jobError } = await supabaseClient
      .from('jobs')
      .insert({
        user_id: userId,
        workflow_name,
        resource_id,
        workflow_execution_id,
        status: 'pending' as JobStatus,
        metadata,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (jobError) {
      console.error('Error creating job:', jobError)
      return new Response(
        JSON.stringify({ error: 'Failed to create job', details: jobError.message }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create job steps
    const jobSteps = steps.map(step => ({
      job_id: job.id,
      step_name: step.step_name,
      step_type: step.step_type,
      step_order: step.step_order,
  status: 'pending' as StepStatus,
      metadata: step.metadata
    }))

    const { data: createdSteps, error: stepsError } = await supabaseClient
      .from('job_steps')
      .insert(jobSteps)
      .select()

    if (stepsError) {
      console.error('Error creating job steps:', stepsError)
      // Try to cleanup the job if steps creation failed
      await supabaseClient.from('jobs').delete().eq('id', job.id)
      
      return new Response(
        JSON.stringify({ error: 'Failed to create job steps' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({
        ...job,
        steps: createdSteps
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in create-job function:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/create-job' \
    --header 'Authorization: Bearer [SERVICE_ROLE_KEY]' \
    --header 'Content-Type: application/json' \
    --data '{"workflow_name":"test","user_id":"123","steps":[{"step_name":"test","step_type":"test","step_order":1}]}'

*/
