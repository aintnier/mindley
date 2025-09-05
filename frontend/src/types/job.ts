export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type JobStepStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface Job {
  id: string;
  user_id: string;
  workflow_name: string;
  workflow_execution_id: string | null;
  status: JobStatus;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any>;
  resource_id: number | null;
}

export interface JobStep {
  id: string;
  job_id: string;
  step_name: string;
  step_type: string;
  status: JobStepStatus;
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  output_data: Record<string, any> | null;
  step_order: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata: Record<string, any>;
}

export interface JobWithSteps extends Job {
  steps: JobStep[];
}

export interface JobNotification {
  type: 'job_created' | 'job_updated' | 'step_updated' | 'job_completed' | 'job_failed';
  job: Job;
  step?: JobStep;
  message: string;
}

export interface CreateJobRequest {
  workflow_name: string;
  resource_id?: number;
  steps: Array<{
    name: string;
    type: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    metadata?: Record<string, any>;
  }>;
}
