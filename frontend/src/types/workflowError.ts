// Types for workflow error handling
export interface WorkflowError {
  id: string;
  user_id: string;
  workflow_execution_id?: string;
  workflow_name: string;
  error_message: string;
  error_node?: string;
  error_data?: Record<string, any>;
  created_at: string;
  notified_at?: string;
}

export interface WorkflowErrorNotification {
  type: 'workflow_error';
  workflowError: WorkflowError;
  message: string;
}
