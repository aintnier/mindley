import { useState, useEffect, useCallback, useRef } from "react";
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
  const lastStatusNotifiedRef = useRef<Record<string, Job["status"]>>({});
  const lastStepNotifiedRef = useRef<Set<string>>(new Set());

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

  const activeJobs = jobs.filter(
    (job) => job.status === "running" || job.status === "pending"
  );

  const recentJobs = jobs.filter((job) => {
    const today = new Date().toDateString();
    const jobDate = new Date(job.created_at).toDateString();
    return jobDate === today;
  });

  const showNotification = useCallback(
    (notification: JobNotification) => {
      if (!showToasts) return;

      const getToastVariant = (type: JobNotification["type"]) => {
        switch (type) {
          case "job_completed":
            return "default";
          case "job_failed":
            return "destructive";
          case "step_updated":
            // If the step itself failed, show destructive styling
            return "default";
          default:
            return "default";
        }
      };

      const getToastTitle = (notification: JobNotification) => {
        switch (notification.type) {
          case "job_created":
            return `Workflow started`;
          case "step_updated": {
            if (notification.step?.status === "running")
              return `Step: ${notification.step.step_name}`;
            if (notification.step?.status === "completed")
              return `Step completed: ${notification.step.step_name}`;
            if (notification.step?.status === "failed")
              return `Step failed: ${notification.step.step_name}`;
            return `Step: ${notification.step?.step_name ?? ""}`;
          }
          case "job_failed":
            return "Workflow failed";
          default:
            return "Notification";
        }
      };

      const desc =
        notification.message && notification.message.trim().length > 0
          ? notification.message
          : undefined;
      console.log("[JobNotifications] Trigger toast:", {
        type: notification.type,
        title: getToastTitle(notification),
        message: notification.message,
      });

      // Determine variant
      let variant = getToastVariant(notification.type) as
        | "default"
        | "destructive"
        | undefined;
      if (
        notification.type === "step_updated" &&
        notification.step?.status === "failed"
      ) {
        variant = "destructive";
      }

      toast({
        title: getToastTitle(notification),
        description: desc,
        variant,
        duration:
          notification.type === "step_updated" &&
          notification.step?.status === "running"
            ? 15000
            : 12000,
      });
    },
    [showToasts, toast]
  );

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

  useEffect(() => {
    if (!userId) return;

    let jobsChannel: RealtimeChannel;
    let stepsChannel: RealtimeChannel;

    const setupSubscriptions = async () => {
      console.log(
        `[JobNotifications] Setting up subscriptions for user: ${userId}`
      );

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
            console.log(
              "[JobNotifications] Jobs table change received:",
              payload
            );
            const job = payload.new as Job;
            const oldJob = payload.old as Job;
            const evt = (payload as any).eventType ?? (payload as any).event;

            if (evt === "INSERT") {
              console.log(
                `[JobNotifications] New job created: ${job.workflow_name} for user ${job.user_id}`
              );
              updateLocalJob(job);
              showNotification({
                type: "job_created",
                job,
                message: `Workflow "${job.workflow_name}" started (status: ${job.status}).`,
              });
              lastStatusNotifiedRef.current[job.id] = job.status;
            } else if (evt === "UPDATE") {
              console.log(
                `[JobNotifications] Job updated: ${job.workflow_name} status changed from ${oldJob?.status} to ${job.status}`
              );
              updateLocalJob(job);

              const alreadyNotifiedStatus =
                lastStatusNotifiedRef.current[job.id] === job.status;
              const statusActuallyChanged = oldJob?.status !== job.status;

              if (!alreadyNotifiedStatus || statusActuallyChanged) {
                if (job.status === "failed") {
                  showNotification({
                    type: "job_failed",
                    job,
                    message:
                      job.error_message ||
                      `Workflow "${job.workflow_name}" failed`,
                  });
                }
                lastStatusNotifiedRef.current[job.id] = job.status;
              }
            }
          }
        )
        .subscribe((status, err) => {
          console.log(
            "[JobNotifications] Jobs subscription status:",
            status,
            err
          );
        });

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
            console.log(
              "[JobNotifications] Job step change received:",
              payload
            );
            const step = payload.new as JobStep;
            const oldStep = payload.old as JobStep;
            const evt = (payload as any).eventType ?? (payload as any).event;

            const statusChanged = oldStep?.status !== step.status;
            const isInteresting =
              step.status === "running" ||
              step.status === "completed" ||
              step.status === "failed";
            if (
              statusChanged &&
              isInteresting &&
              (evt === "UPDATE" || evt === undefined)
            ) {
              try {
                const jobWithSteps = await JobService.getJobWithSteps(
                  step.job_id
                );

                if (jobWithSteps && jobWithSteps.user_id === userId) {
                  // If the overall job already failed, skip step toasts so the job failure toast remains visible
                  if (jobWithSteps.status === "failed") {
                    console.log(
                      `[JobNotifications] Skipping step toast because job ${jobWithSteps.id} already failed`
                    );
                    return;
                  }
                  const stepsArr =
                    jobWithSteps.steps || (jobWithSteps as any).job_steps || [];
                  const total = stepsArr.length;
                  const completedSteps = stepsArr.filter(
                    (s: any) =>
                      s.status === "completed" || s.status === "skipped"
                  ).length;

                  const nextStep = stepsArr.find(
                    (s: any) => s.status === "running" || s.status === "pending"
                  );

                  const isLastStepJustCompleted =
                    step.status === "completed" && completedSteps === total;
                  let description = "";
                  if (step.status === "running") {
                    description = "Running...";
                  } else if (step.status === "failed") {
                    description = "Failed.";
                  } else if (
                    step.status === "completed" &&
                    !isLastStepJustCompleted &&
                    nextStep
                  ) {
                    description = `Currently running step: ${nextStep.step_name}`;
                  } else if (step.status === "completed") {
                    description = "";
                  }

                  console.log(
                    `[JobNotifications] Showing step notification for user ${userId}:`,
                    description || "(no description)"
                  );

                  const stepKey = `${step.job_id}:${step.id}:${step.status}`;
                  if (!lastStepNotifiedRef.current.has(stepKey)) {
                    if (
                      !(isLastStepJustCompleted && step.status === "completed")
                    ) {
                      // for failed steps, mark notification so it renders destructive
                      const notif = {
                        type: "step_updated" as const,
                        job: jobWithSteps,
                        step,
                        message: description,
                      };

                      // If this step failed, force destructive variant when showing
                      if (step.status === "failed") {
                        showNotification({ ...notif, type: "step_updated" });
                      } else {
                        showNotification(notif);
                      }
                    }
                    lastStepNotifiedRef.current.add(stepKey);
                  } else {
                    console.log(
                      `[JobNotifications] Duplicate step toast suppressed for ${stepKey}`
                    );
                  }
                } else {
                  console.log(
                    `[JobNotifications] Ignoring step update for job ${step.job_id} (not owned by user ${userId})`
                  );
                }
              } catch (error) {
                console.error(
                  "[JobNotifications] Error fetching job for step notification:",
                  error
                );
              }
            }
          }
        )
        .subscribe((status, err) => {
          console.log(
            "[JobNotifications] Job steps subscription status:",
            status,
            err
          );
        });
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

  useEffect(() => {
    loadJobs();
  }, [loadJobs]);

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
