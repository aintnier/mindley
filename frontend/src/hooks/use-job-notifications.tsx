import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { JobService } from "@/services/jobService";
import type { Job, JobStep, JobNotification } from "@/types/job";
import type { RealtimeChannel } from "@supabase/supabase-js";

export interface UseJobNotificationsOptions {
  showToasts?: boolean;
  userId?: string;
}

export function useJobNotifications(options: UseJobNotificationsOptions = {}) {
  const { showToasts = true, userId } = options;
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load initial jobs
  const loadJobs = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      const userJobs = await JobService.getUserJobs();
      setJobs(userJobs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load jobs");
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  // Get running/pending jobs
  const activeJobs = jobs.filter(
    (job) => job.status === "running" || job.status === "pending"
  );

  // Get completed jobs from today
  const recentJobs = jobs.filter((job) => {
    const today = new Date().toDateString();
    const jobDate = new Date(job.created_at).toDateString();
    return jobDate === today;
  });

  // Show toast notification
  const showNotification = useCallback(
    (notification: JobNotification) => {
      if (!showToasts) return;

      const getToastVariant = (type: JobNotification["type"]) => {
        switch (type) {
          case "job_completed":
            return "default";
          case "job_failed":
            return "destructive";
          default:
            return "default";
        }
      };

      const getToastTitle = (type: JobNotification["type"]) => {
        switch (type) {
          case "job_created":
            return "Workflow Started";
          case "job_updated":
            return "Workflow Running";
          case "step_updated":
            return "Step Completed";
          case "job_completed":
            return "Workflow Completed";
          case "job_failed":
            return "Workflow Failed";
          default:
            return "Workflow Notification";
        }
      };

      toast({
        title: getToastTitle(notification.type),
        description: notification.message,
        variant: getToastVariant(notification.type),
      });
    },
    [showToasts, toast]
  );

  // Update local jobs state
  const updateLocalJob = useCallback((updatedJob: Job) => {
    setJobs((prevJobs) => {
      const existingIndex = prevJobs.findIndex(
        (job) => job.id === updatedJob.id
      );
      if (existingIndex >= 0) {
        const newJobs = [...prevJobs];
        newJobs[existingIndex] = updatedJob;
        return newJobs;
      } else {
        return [updatedJob, ...prevJobs];
      }
    });
  }, []);

  // Setup realtime subscriptions
  useEffect(() => {
    if (!userId) return;

    let jobsChannel: RealtimeChannel;
    let stepsChannel: RealtimeChannel;

    const setupSubscriptions = async () => {
      // Subscribe to jobs changes
      jobsChannel = supabase
        .channel("jobs_changes")
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "jobs",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const job = payload.new as Job;
            const oldJob = payload.old as Job;

            if (payload.eventType === "INSERT") {
              updateLocalJob(job);
              showNotification({
                type: "job_created",
                job,
                message: `Workflow "${job.workflow_name}" started.`,
              });
            } else if (payload.eventType === "UPDATE") {
              updateLocalJob(job);

              // Notify on status changes
              if (oldJob?.status !== job.status) {
                if (job.status === "completed") {
                  showNotification({
                    type: "job_completed",
                    job,
                    message: `Workflow "${job.workflow_name}" completed successfully.`,
                  });
                } else if (job.status === "failed") {
                  showNotification({
                    type: "job_failed",
                    job,
                    message:
                      job.error_message ||
                      `Workflow "${job.workflow_name}" failed`,
                  });
                } else if (job.status === "running") {
                  showNotification({
                    type: "job_updated",
                    job,
                    message: `Workflow "${job.workflow_name}" running...`,
                  });
                }
              }
            }
          }
        )
        .subscribe();

      // Subscribe to job steps changes for more granular notifications
      stepsChannel = supabase
        .channel("job_steps_changes")
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "job_steps",
          },
          async (payload) => {
            const step = payload.new as JobStep;
            const oldStep = payload.old as JobStep;

            // Only notify on status changes to completed
            if (
              oldStep?.status !== step.status &&
              step.status === "completed"
            ) {
              try {
                // Get the job to show proper notification
                const jobWithSteps = await JobService.getJobWithSteps(
                  step.job_id
                );
                if (jobWithSteps && jobWithSteps.user_id === userId) {
                  // Calculate progress
                  const total = jobWithSteps.steps.length;
                  const completedSteps = jobWithSteps.steps.filter(
                    (s) => s.status === "completed" || s.status === "skipped"
                  ).length;
                  // Determine next running / pending step name
                  const nextStep = jobWithSteps.steps.find(
                    (s) => s.status === "running" || s.status === "pending"
                  );
                  const percentage =
                    total > 0 ? Math.round((completedSteps / total) * 100) : 0;
                  const baseMsg = `Step "${step.step_name}" completed (${completedSteps}/${total} - ${percentage}%).`;
                  const nextMsg = nextStep
                    ? ` Currently running: "${nextStep.step_name}".`
                    : "";
                  showNotification({
                    type: "step_updated",
                    job: jobWithSteps,
                    step,
                    message: baseMsg + nextMsg,
                  });
                }
              } catch (error) {
                console.error(
                  "Error fetching job for step notification:",
                  error
                );
              }
            }
          }
        )
        .subscribe();
    };

    setupSubscriptions();

    return () => {
      if (jobsChannel) {
        supabase.removeChannel(jobsChannel);
      }
      if (stepsChannel) {
        supabase.removeChannel(stepsChannel);
      }
    };
  }, [userId, updateLocalJob, showNotification]);

  // Load jobs on mount
  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

  // Helper functions
  const getJobProgress = useCallback(
    async (
      jobId: string
    ): Promise<{ completed: number; total: number; percentage: number }> => {
      try {
        const jobWithSteps = await JobService.getJobWithSteps(jobId);
        if (!jobWithSteps) return { completed: 0, total: 0, percentage: 0 };

        const completedSteps = jobWithSteps.steps.filter(
          (step) => step.status === "completed" || step.status === "skipped"
        ).length;
        const totalSteps = jobWithSteps.steps.length;
        const percentage =
          totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

        return { completed: completedSteps, total: totalSteps, percentage };
      } catch (error) {
        console.error("Error calculating job progress:", error);
        return { completed: 0, total: 0, percentage: 0 };
      }
    },
    []
  );

  const createJob = useCallback(
    async (request: Parameters<typeof JobService.createJob>[0]) => {
      if (!userId) throw new Error("User not authenticated");

      try {
        const jobWithSteps = await JobService.createJob(request);
        await loadJobs(); // Refresh jobs list
        return jobWithSteps.id;
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to create job"
        );
        throw error;
      }
    },
    [userId, loadJobs]
  );

  const cancelJob = useCallback(
    async (jobId: string) => {
      try {
        await JobService.cancelJob(jobId);
        await loadJobs(); // Refresh jobs list
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Failed to cancel job"
        );
        throw error;
      }
    },
    [loadJobs]
  );

  return {
    jobs,
    activeJobs,
    recentJobs,
    isLoading,
    error,
    loadJobs,
    createJob,
    cancelJob,
    getJobProgress,
  };
}
