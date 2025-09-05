import { supabase } from '@/lib/supabase';
import type { Job, JobStep, JobWithSteps, CreateJobRequest, JobStatus, JobStepStatus } from '@/types/job';

export class JobService {
  /**
   * Creates a new job with predefined steps using Edge Function
   */
  static async createJob(request: CreateJobRequest): Promise<JobWithSteps> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('User not authenticated');
    }

    // Map the request to match the edge function interface
    const jobData = {
      workflow_name: request.workflow_name,
      resource_id: request.resource_id,
      metadata: {},
      steps: request.steps.map((step, index) => ({
        step_name: step.name,
        step_type: step.type,
        step_order: index + 1,
        metadata: step.metadata || {}
      }))
    };

    const { data, error } = await supabase.functions.invoke('create-job', {
      body: jobData,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      }
    });

    if (error) {
      throw new Error(`Failed to create job: ${error.message}`);
    }

    return data;
  }

  /**
   * Gets all jobs for the current user using Edge Function
   */
  static async getUserJobs(status?: JobStatus, limit: number = 10): Promise<JobWithSteps[]> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('User not authenticated');
    }

    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (status) {
      params.append('status', status);
    }

    const { data, error } = await supabase.functions.invoke('get-job-status', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      }
    });

    if (error) {
      throw new Error(`Failed to fetch jobs: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Gets a specific job with its steps using Edge Function
   */
  static async getJobWithSteps(jobId: string): Promise<JobWithSteps | null> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('User not authenticated');
    }

    const params = new URLSearchParams();
    params.append('job_id', jobId);

    const { data, error } = await supabase.functions.invoke('get-job-status?' + params.toString(), {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      }
    });

    if (error) {
      throw new Error(`Failed to fetch job: ${error.message}`);
    }
    if (!data) return null;
    // Normalize shape: edge function returns job_steps for historical reasons; map to steps expected by frontend types
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const normalized: any = { ...data };
    if (!normalized.steps && Array.isArray(normalized.job_steps)) {
      normalized.steps = normalized.job_steps;
    }
    return normalized as JobWithSteps;
  }

  /**
   * Updates job step status using Edge Function
   */
  static async updateJobStepByName(
    jobId: string,
    stepName: string,
    status: JobStepStatus,
    errorMessage?: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    outputData?: Record<string, any>,
    workflowExecutionId?: string
  ): Promise<{ updated_step: JobStep; job: JobWithSteps }> {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('User not authenticated');
    }

    const updateData = {
      job_id: jobId,
      step_name: stepName,
      status,
      error_message: errorMessage,
      output_data: outputData,
      workflow_execution_id: workflowExecutionId
    };

    const { data, error } = await supabase.functions.invoke('update-job-step', {
      body: updateData,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      }
    });

    if (error) {
      throw new Error(`Failed to update job step: ${error.message}`);
    }

    return data;
  }

  /**
   * Legacy methods using direct Supabase access (for backward compatibility)
   */
  
  /**
   * Updates job status directly
   */
  static async updateJobStatus(
    jobId: string, 
    status: JobStatus, 
    errorMessage?: string,
    workflowExecutionId?: string
  ): Promise<void> {
    const updates: Partial<Job> = { status };
    
    if (status === 'running') {
      updates.started_at = new Date().toISOString();
    } else if (status === 'completed' || status === 'failed') {
      updates.completed_at = new Date().toISOString();
    }
    
    if (errorMessage) {
      updates.error_message = errorMessage;
    }

    if (workflowExecutionId) {
      updates.workflow_execution_id = workflowExecutionId;
    }

    const { error } = await supabase
      .from('jobs')
      .update(updates)
      .eq('id', jobId);

    if (error) {
      throw new Error(`Failed to update job status: ${error.message}`);
    }
  }

  /**
   * Updates job step status
   */
  static async updateJobStepStatus(
    stepId: string,
    status: JobStepStatus,
    errorMessage?: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    outputData?: Record<string, any>
  ): Promise<void> {
    const updates: Partial<JobStep> = { status };
    
    if (status === 'running') {
      updates.started_at = new Date().toISOString();
    } else if (status === 'completed' || status === 'failed' || status === 'skipped') {
      updates.completed_at = new Date().toISOString();
    }
    
    if (errorMessage) {
      updates.error_message = errorMessage;
    }

    if (outputData) {
      updates.output_data = outputData;
    }

    const { error } = await supabase
      .from('job_steps')
      .update(updates)
      .eq('id', stepId);

    if (error) {
      throw new Error(`Failed to update job step status: ${error.message}`);
    }
  }

  /**
   * Cancels a job and all its pending steps
   */
  static async cancelJob(jobId: string): Promise<void> {
    // Update job status
    await this.updateJobStatus(jobId, 'cancelled');

    // Update all pending/running steps to cancelled
    const { error } = await supabase
      .from('job_steps')
      .update({ 
        status: 'skipped',
        completed_at: new Date().toISOString()
      })
      .eq('job_id', jobId)
      .in('status', ['pending', 'running']);

    if (error) {
      throw new Error(`Failed to cancel job steps: ${error.message}`);
    }
  }

  /**
   * Deletes old completed jobs (older than specified days)
   */
  static async cleanupOldJobs(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const { data, error } = await supabase
      .from('jobs')
      .delete()
      .in('status', ['completed', 'failed', 'cancelled'])
      .lt('completed_at', cutoffDate.toISOString())
      .select('id');

    if (error) {
      throw new Error(`Failed to cleanup old jobs: ${error.message}`);
    }

    return data?.length || 0;
  }
}
