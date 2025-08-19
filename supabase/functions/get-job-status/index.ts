// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from 'jsr:@supabase/supabase-js@2'

console.log("Get Job Status Function started")

function decodeJwt(token: string): any | null {
  try {
    const payload = token.split('.')[1]
    if (!payload) return null
    return JSON.parse(atob(payload))
  } catch {
    return null
  }
}

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

    const token = authHeader.replace('Bearer ', '')
    const decoded = decodeJwt(token)
    const isServiceRole = decoded?.role === 'service_role'

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = isServiceRole 
      ? Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! 
      : Deno.env.get('SUPABASE_ANON_KEY')!

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: !isServiceRole ? { headers: { Authorization: authHeader } } : undefined,
      auth: { autoRefreshToken: false, persistSession: false }
    })

    const url = new URL(req.url)
    let userId: string | undefined
    const jobIdParam = url.searchParams.get('job_id')

    if (isServiceRole) {
      // Priority: explicit user_id query param
      userId = url.searchParams.get('user_id') || undefined
      // If not provided but job_id present, fetch job to derive user_id
      if (!userId && jobIdParam) {
        const { data: owningJob } = await supabase
          .from('jobs')
          .select('id, user_id')
          .eq('id', jobIdParam)
          .single()
        if (owningJob) userId = owningJob.user_id
      }
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'user_id (or resolvable job_id) required with service role' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    } else {
      // User JWT path
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      if (userError || !user) {
        return new Response(
          JSON.stringify({ error: 'Invalid authorization token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      userId = user.id
    }

  const jobId = jobIdParam
    const limit = parseInt(url.searchParams.get('limit') || '10')
    const status = url.searchParams.get('status')

    if (jobId) {
      // Get specific job with steps
      const { data: job, error: jobError } = await supabase
        .from('jobs')
        .select(`
          *,
          job_steps (*)
        `)
  .eq('id', jobId)
  .eq('user_id', userId)
        .single()

      if (jobError || !job) {
        return new Response(
          JSON.stringify({ error: 'Job not found or access denied' }),
          { 
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Sort steps by order
      if (job.job_steps) {
        job.job_steps.sort((a: any, b: any) => a.step_order - b.step_order)
      }

      return new Response(
        JSON.stringify(job),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    } else {
      // Get all jobs for user
      let query = supabase
        .from('jobs')
        .select(`
          *,
          job_steps (*)
        `)
  .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit)

      if (status) {
        query = query.eq('status', status)
      }

      const { data: jobs, error: jobsError } = await query

      if (jobsError) {
        console.error('Error fetching jobs:', jobsError)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch jobs' }),
          { 
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }

      // Sort steps by order for each job
      jobs?.forEach((job: any) => {
        if (job.job_steps) {
          job.job_steps.sort((a: any, b: any) => a.step_order - b.step_order)
        }
      })

      return new Response(
        JSON.stringify(jobs || []),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

  } catch (error) {
    console.error('Error in get-job-status function:', error)
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

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/get-job-status' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
