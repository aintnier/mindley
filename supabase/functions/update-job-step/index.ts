// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

interface UpdateJobStepRequest {
  job_id: string
  step_name: string
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'
  error_message?: string
  output_data?: Record<string, any>
  workflow_execution_id?: string
  resource_id?: number
  metadata?: Record<string, any>
}

console.log("Update Job Step Function started")

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

Deno.serve(async (req) => {
  console.log('All headers:', [...req.headers.entries()]);
  
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

  // Check if it's a service role key (from n8n) or user JWT (from frontend)
  const token = authHeader.replace('Bearer ', '')
  const isServiceRoleKey = isServiceRoleToken(token)
    
    let supabase;
    let user;
    
  if (isServiceRoleKey) {
      // n8n workflow call with service role key
      supabase = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );

      // For n8n calls, we need to get user_id from the job record
      const bodyText = await req.text()
      const requestBody = JSON.parse(bodyText)
      const { job_id } = requestBody
      
      if (!job_id) {
        return new Response(
          JSON.stringify({ error: 'job_id is required' }),
          { 
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Get job to find user_id
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select('id, user_id')
        .eq('id', job_id)
        .single()

      if (jobError || !job) {
        return new Response(
          JSON.stringify({ error: 'Job not found' }),
          { 
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Create a mock user object for compatibility
      user = { id: job.user_id }
      
      // Re-create request object since we consumed the body
      req = new Request(req.url, {
        method: req.method,
        headers: req.headers,
        body: bodyText
      })
      
  } else {
      // Frontend call - verify JWT
      supabase = createClient(
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
      const { data: { user: authUser }, error: userError } = await supabase.auth.getUser()
      
      if (userError || !authUser) {
        return new Response(
          JSON.stringify({ error: 'Invalid authorization token' }),
          { 
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
      
      user = authUser
    }

    const { 
      job_id, 
      step_name, 
      status, 
      error_message, 
      output_data,
  workflow_execution_id,
  resource_id,
  metadata
    }: UpdateJobStepRequest = await req.json()

    if (!job_id || !step_name || !status) {
      return new Response(
        JSON.stringify({ error: 'job_id, step_name, and status are required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify job belongs to user (if service role we already fetched job earlier; still enforce user match)
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select('id, user_id')
      .eq('id', job_id)
      .single()

    if (jobError || !job || (!isServiceRoleKey && job.user_id !== user.id)) {
      return new Response(
        JSON.stringify({ error: 'Job not found or access denied' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Update workflow execution ID if provided
    if (workflow_execution_id || resource_id !== undefined) {
      const jobUpdate: Record<string, any> = {}
      if (workflow_execution_id) jobUpdate.workflow_execution_id = workflow_execution_id
      if (resource_id !== undefined) jobUpdate.resource_id = resource_id
      if (Object.keys(jobUpdate).length) {
        await supabase
          .from('jobs')
          .update(jobUpdate)
          .eq('id', job_id)
      }
    }

    // Prepare update data
    const updateData: any = {
      status,
      error_message
    }

    if (status === 'running' && !error_message) {
      // Step explicitly moved to running
      updateData.started_at = new Date().toISOString()
    } else if (status === 'completed' || status === 'failed' || status === 'skipped') {
      // Terminal state: ensure completed_at set
      const nowIso = new Date().toISOString()
      updateData.completed_at = nowIso
      // If step jumped directly from pending -> terminal without a running phase, also set started_at
      updateData.started_at = updateData.started_at || nowIso
    }

    if (output_data) {
      updateData.output_data = output_data
    }
    if (metadata) {
      updateData.metadata = metadata
    }

    // Update job step
    const { data: updatedStep, error: updateError } = await supabase
      .from('job_steps')
      .update(updateData)
      .eq('job_id', job_id)
      .eq('step_name', step_name)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating job step:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update job step' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Get updated job with all steps for response
    const { data: jobWithSteps } = await supabase
      .from('jobs')
      .select(`
        *,
        job_steps (*)
      `)
      .eq('id', job_id)
      .single()

    // Auto-finalization & progression logic for the parent job
    if (jobWithSteps && jobWithSteps.job_steps) {
      const steps: any[] = jobWithSteps.job_steps
      const total = steps.length
      const anyFailed = steps.some(s => s.status === 'failed')
      const allTerminal = steps.every(s => ['completed', 'failed', 'skipped'].includes(s.status))
      const anyProgress = steps.some(s => ['running', 'completed', 'failed', 'skipped'].includes(s.status))

      let newStatus: string | undefined
      if (jobWithSteps.status !== 'failed' && jobWithSteps.status !== 'completed') {
        if (anyFailed) {
          newStatus = 'failed'
        } else if (allTerminal) {
          newStatus = 'completed'
        } else if (jobWithSteps.status === 'pending' && anyProgress) {
          // Move from pending -> running when first step reports progress (even if directly completed)
          newStatus = 'running'
        }
      }

      if (newStatus) {
        const jobUpdate: Record<string, any> = { status: newStatus }
        const nowIso = new Date().toISOString()
        // Ensure started_at is populated the first time we leave pending (even if we jump straight to completed/failed)
        if (!jobWithSteps.started_at) {
          jobUpdate.started_at = nowIso
        }
        if (newStatus === 'failed' || newStatus === 'completed') {
          jobUpdate.completed_at = nowIso
        }

        const { error: jobStatusError } = await supabase
          .from('jobs')
          .update(jobUpdate)
          .eq('id', job_id)

        if (!jobStatusError) {
          // Reflect status change locally without refetching
          jobWithSteps.status = newStatus
          if (jobUpdate.completed_at) jobWithSteps.completed_at = jobUpdate.completed_at
        } else {
          console.error('Failed to auto-update job status:', jobStatusError)
        }
      }
    }

    return new Response(
      JSON.stringify({
        updated_step: updatedStep,
        job: jobWithSteps
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in update-job-step function:', error)
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

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/update-job-step' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
