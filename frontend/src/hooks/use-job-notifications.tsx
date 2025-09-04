import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { JobService } from "@/services/jobService";
import type { Job, JobStep, JobNotification, JobWithSteps } from "@/types/job";
import type { WorkflowErrorNotification } from "@/types/workflowError";
import { useReliableRealtime } from "./use-reliable-realtime";

export interface UseJobNotificationsOptions {
  showToasts?: boolean;
  userId?: string;
}

interface PollerEvent {
  source: string;
  payload: {
    new: Job | JobStep;
    old: Job | JobStep | Record<string, never>;
    event: string;
  };
  isSynthetic: boolean;
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
    (
      notification: (JobNotification | WorkflowErrorNotification) & {
        customVariant?: "default" | "destructive" | "success" | "primary";
      }
    ) => {
      if (!showToasts) return;

      const getToastVariant = (
        type: JobNotification["type"] | "workflow_error"
      ) => {
        switch (type) {
          case "job_completed":
            return "default";
          case "job_failed":
          case "workflow_error":
            return "destructive";
          case "step_updated":
            // If the step itself failed, show destructive styling
            return "default";
          default:
            return "default";
        }
      };

      const getToastTitle = (
        notification: (JobNotification | WorkflowErrorNotification) & {
          customVariant?: "default" | "destructive" | "success" | "primary";
        }
      ) => {
        if (notification.customVariant === "primary") {
          return "Resource Already Available";
        }

        switch (notification.type) {
          case "job_created":
            return `Workflow started`;
          case "step_updated": {
            const stepNotification = notification as JobNotification;
            if (stepNotification.step?.status === "running")
              return `Step: ${stepNotification.step.step_name}`;
            if (stepNotification.step?.status === "completed")
              return `Step completed: ${stepNotification.step.step_name}`;
            if (stepNotification.step?.status === "failed")
              return `Step failed: ${stepNotification.step.step_name}`;
            return `Step: ${stepNotification.step?.step_name ?? ""}`;
          }
          case "job_failed":
            return "Workflow failed";
          case "workflow_error": {
            const workflowNotification =
              notification as WorkflowErrorNotification;
            return `Workflow Error: ${
              workflowNotification.workflowError.error_node || "Node Failed"
            }`;
          }
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
      let variant =
        notification.customVariant ||
        (getToastVariant(notification.type) as
          | "default"
          | "destructive"
          | "success"
          | "primary"
          | undefined);
      if (
        !notification.customVariant &&
        notification.type === "step_updated" &&
        (notification as JobNotification).step?.status === "failed"
      ) {
        variant = "destructive";
      }

      toast({
        title: getToastTitle(notification),
        description: desc,
        variant,
        duration:
          notification.type === "step_updated" &&
          (notification as JobNotification).step?.status === "running"
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

  // --- Unified event handler (realtime + polling synthetic) ---
  const handleEvent = useCallback(
    async (evt: { source: string; payload: any; isSynthetic: boolean }) => {
      if (!userId) return;
      const payload = evt.payload;

      // Handle workflow error events
      if (evt.source === "workflow_errors") {
        const workflowError = payload.new;
        const eventType = (payload as any).eventType ?? (payload as any).event;

        if (eventType === "INSERT" && workflowError.user_id === userId) {
          showNotification({
            type: "workflow_error",
            workflowError,
            message:
              workflowError.error_message ||
              "An error occurred during workflow execution",
          });
        }
        return;
      }

      // Handle existing job/job_step events
      if (evt.source === "jobs") {
        const job = payload.new as Job;
        const oldJob = payload.old as Job;
        const eventType = (payload as any).eventType ?? (payload as any).event;

        if (eventType === "INSERT") {
          updateLocalJob(job);
          showNotification({
            type: "job_created",
            job,
            message: `Workflow "${job.workflow_name}" started (status: ${job.status}).`,
          });
          lastStatusNotifiedRef.current[job.id] = job.status;
        } else if (eventType === "UPDATE") {
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
                  job.error_message || `Workflow "${job.workflow_name}" failed`,
              });
            }
            lastStatusNotifiedRef.current[job.id] = job.status;
          }
        }
      } else if (evt.source === "job_steps") {
        const step = payload.new as JobStep;
        const oldStep = payload.old as JobStep;
        const eventType = (payload as any).eventType ?? (payload as any).event;
        const statusChanged = oldStep?.status !== step.status;
        const isInteresting = ["running", "completed", "failed"].includes(
          step.status
        );
        if (
          statusChanged &&
          isInteresting &&
          (eventType === "UPDATE" || eventType === undefined)
        ) {
          try {
            const jobWithSteps = await JobService.getJobWithSteps(step.job_id);
            if (jobWithSteps && jobWithSteps.user_id === userId) {
              if (jobWithSteps.status === "failed") return; // skip if job already failed
              const stepsArr = jobWithSteps.steps || [];
              const total = stepsArr.length;
              const completedSteps = stepsArr.filter((s: JobStep) =>
                ["completed", "skipped"].includes(s.status)
              ).length;

              // Smart next step logic to handle conditional workflows
              // If there are completed steps with higher step_order than pending steps,
              // those pending steps should be considered as skipped/obsolete
              const completedStepsArray = stepsArr.filter((s: JobStep) =>
                ["completed", "skipped"].includes(s.status)
              );
              const maxCompletedOrder =
                completedStepsArray.length > 0
                  ? Math.max(
                      ...completedStepsArray.map((s: JobStep) => s.step_order)
                    )
                  : 0;

              // First, look for running steps (highest priority)
              let nextStep = stepsArr
                .filter((s: JobStep) => s.status === "running")
                .sort(
                  (a: JobStep, b: JobStep) => a.step_order - b.step_order
                )[0];

              // If no running steps, look for pending steps after the highest completed step
              if (!nextStep) {
                nextStep = stepsArr
                  .filter(
                    (s: JobStep) =>
                      s.status === "pending" && s.step_order > maxCompletedOrder
                  )
                  .sort(
                    (a: JobStep, b: JobStep) => a.step_order - b.step_order
                  )[0];
              }

              // Fallback: if still no step found, use original logic (for edge cases)
              if (!nextStep) {
                nextStep = stepsArr
                  .filter((s: JobStep) =>
                    ["running", "pending"].includes(s.status)
                  )
                  .sort(
                    (a: JobStep, b: JobStep) => a.step_order - b.step_order
                  )[0];
              }

              const isLastStepJustCompleted =
                step.status === "completed" && completedSteps === total;

              // Handle special cases for duplicate handling
              const isSameUserDuplicate =
                step.step_name === "Handle Duplicates: Same User" &&
                step.status === "completed";
              const isDifferentUserDuplicate =
                step.step_name === "Handle Duplicates: Different User" &&
                step.status === "completed";
              const isDifferentUserFailed =
                step.step_name.includes("Different User") &&
                step.status === "failed";

              console.log("[JobNotifications] Step analysis:", {
                stepName: step.step_name,
                status: step.status,
                isSameUserDuplicate,
                isDifferentUserDuplicate,
                isDifferentUserFailed,
                metadata: step.metadata,
                isLastStepJustCompleted,
                maxCompletedOrder,
                nextStepName: nextStep?.step_name,
                nextStepOrder: nextStep?.step_order,
              });

              let description = "";
              let shouldShowToast = true;
              let customVariant:
                | "default"
                | "destructive"
                | "success"
                | "primary"
                | undefined = undefined;

              if (step.status === "running") {
                description = "Running...";
              } else if (step.status === "failed") {
                if (isDifferentUserFailed) {
                  // Handle failure case for Different User duplicate handling
                  description = "Failed to process resource";
                  customVariant = "destructive";
                } else {
                  description = "Failed.";
                }
              } else if (isSameUserDuplicate) {
                // Resource already in user's collection - show info toast and redirect
                const resourceId = step.metadata?.reference_id;
                const resourceTitle = step.metadata?.reference_title;

                if (resourceId && resourceTitle) {
                  description = `Resource already in your collection: ${resourceTitle}`;
                  customVariant = "primary";

                  // Redirect to resource detail page
                  setTimeout(() => {
                    window.location.href = `/resource/${resourceId}`;
                  }, 2000);
                } else {
                  description = "Resource already in your collection";
                  customVariant = "primary";
                }
              } else if (isDifferentUserDuplicate) {
                // Resource copied from another user - suppress success toast
                shouldShowToast = false; // Success job step toast suppressed
              } else if (step.status === "completed") {
                if (isLastStepJustCompleted) {
                  // Regular workflow completion
                  description =
                    "Resource successfully added to your collection";
                  customVariant = "success";

                  // Reload page after short delay
                  setTimeout(() => {
                    window.location.reload();
                  }, 2000);
                } else if (nextStep) {
                  description = `Currently running step: ${nextStep.step_name}`;
                }
              }

              const stepKey = `${step.job_id}:${step.id}:${step.status}`;
              if (
                !lastStepNotifiedRef.current.has(stepKey) &&
                shouldShowToast
              ) {
                if (
                  !(
                    isLastStepJustCompleted &&
                    step.status === "completed" &&
                    !isSameUserDuplicate &&
                    !isDifferentUserDuplicate
                  )
                ) {
                  const notif = {
                    type: "step_updated" as const,
                    job: jobWithSteps,
                    step,
                    message: description,
                    customVariant,
                  };
                  showNotification(notif);
                }
                lastStepNotifiedRef.current.add(stepKey);
              }
            }
          } catch (e) {
            console.error("[JobNotifications] Error handling step event", e);
          }
        }
      }
    },
    [userId, updateLocalJob, showNotification]
  );

  // Poller builds synthetic UPDATE-like events by diffing recent state
  const previousJobsRef = useRef<Record<string, Job>>({});
  const previousStepsRef = useRef<Record<string, JobStep>>({});
  const poller = useCallback(async (): Promise<PollerEvent[]> => {
    if (!userId) return [];
    try {
      const jobs = await JobService.getUserJobs();
      const events: PollerEvent[] = [];
      jobs.forEach((job: JobWithSteps) => {
        const prev = previousJobsRef.current[job.id];
        if (!prev) {
          events.push({
            source: "jobs",
            payload: { new: job, old: {}, event: "INSERT" },
            isSynthetic: true,
          });
        } else if (prev.status !== job.status) {
          events.push({
            source: "jobs",
            payload: { new: job, old: prev, event: "UPDATE" },
            isSynthetic: true,
          });
        }
        previousJobsRef.current[job.id] = job;
        // Steps
        (job.steps || []).forEach((step: JobStep) => {
          const stepKey = step.id;
          const prevStep = previousStepsRef.current[stepKey];
          if (!prevStep) {
            // treat as running update when not pending (skip initial pending noise)
            if (["running", "completed", "failed"].includes(step.status)) {
              events.push({
                source: "job_steps",
                payload: { new: step, old: {}, event: "UPDATE" },
                isSynthetic: true,
              });
            }
          } else if (prevStep.status !== step.status) {
            events.push({
              source: "job_steps",
              payload: { new: step, old: prevStep, event: "UPDATE" },
              isSynthetic: true,
            });
          }
          previousStepsRef.current[stepKey] = step;
        });
      });
      return events;
    } catch (e) {
      console.warn("[JobNotifications] Poller error", e);
      return [];
    }
  }, [userId]);

  useReliableRealtime({
    sources: userId
      ? [
          {
            key: "jobs",
            filter: {
              event: "*",
              schema: "public",
              table: "jobs",
              filter: `user_id=eq.${userId}`,
            },
          },
          {
            key: "job_steps",
            filter: { event: "UPDATE", schema: "public", table: "job_steps" },
          },
          {
            key: "workflow_errors",
            filter: {
              event: "INSERT",
              schema: "public",
              table: "workflow_errors",
              filter: `user_id=eq.${userId}`,
            },
          },
        ]
      : [],
    poller, // fallback
    onEvent: handleEvent,
  });

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
