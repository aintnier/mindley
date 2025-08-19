import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useJobNotifications } from "@/hooks/use-job-notifications";
import { useAuth } from "@/hooks/use-auth";
import { JobService } from "@/services/jobService";
import type { Job } from "@/types/job";
import {
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Play,
  Pause,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface JobProgressInfo {
  completed: number;
  total: number;
  percentage: number;
}

const JobStatusIcon = ({ status }: { status: Job["status"] }) => {
  switch (status) {
    case "pending":
      return <Clock className="h-4 w-4 text-yellow-500" />;
    case "running":
      return <Play className="h-4 w-4 text-blue-500" />;
    case "completed":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "failed":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "cancelled":
      return <Pause className="h-4 w-4 text-gray-500" />;
    default:
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
  }
};

const JobStatusBadge = ({ status }: { status: Job["status"] }) => {
  const variants = {
    pending: "secondary",
    running: "default",
    completed: "default",
    failed: "destructive",
    cancelled: "secondary",
  } as const;

  const labels = {
    pending: "In Attesa",
    running: "In Esecuzione",
    completed: "Completato",
    failed: "Fallito",
    cancelled: "Annullato",
  };

  return (
    <Badge variant={variants[status]} className="flex items-center gap-1">
      <JobStatusIcon status={status} />
      {labels[status]}
    </Badge>
  );
};

const JobCard = ({
  job,
  onCancel,
  showProgress = true,
}: {
  job: Job;
  onCancel?: (jobId: string) => void;
  showProgress?: boolean;
}) => {
  const [progress, setProgress] = useState<JobProgressInfo>({
    completed: 0,
    total: 0,
    percentage: 0,
  });

  useEffect(() => {
    const loadProgress = async () => {
      if (
        !showProgress ||
        (job.status !== "running" && job.status !== "pending")
      )
        return;

      try {
        const progressInfo = await JobService.getJobWithSteps(job.id);
        if (progressInfo) {
          const completedSteps = progressInfo.steps.filter(
            (step) => step.status === "completed" || step.status === "skipped"
          ).length;
          const totalSteps = progressInfo.steps.length;
          const percentage =
            totalSteps > 0
              ? Math.round((completedSteps / totalSteps) * 100)
              : 0;

          setProgress({
            completed: completedSteps,
            total: totalSteps,
            percentage,
          });
        }
      } catch (error) {
        console.error("Error loading job progress:", error);
      }
    };

    loadProgress();

    // Refresh progress every 10 seconds for running jobs
    let interval: NodeJS.Timeout;
    if (job.status === "running") {
      interval = setInterval(loadProgress, 10000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [job.id, job.status, showProgress]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("it-IT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDuration = (startDate?: string | null, endDate?: string | null) => {
    if (!startDate) return null;

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diff = end.getTime() - start.getTime();

    const minutes = Math.floor(diff / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    }
    return `${seconds}s`;
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">
            {job.workflow_name}
          </CardTitle>
          <div className="flex items-center gap-2">
            <JobStatusBadge status={job.status} />
            {(job.status === "running" || job.status === "pending") &&
              onCancel && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => onCancel(job.id)}>
                      Annulla Workflow
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Progress bar for running jobs */}
          {showProgress &&
            (job.status === "running" || job.status === "pending") && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Progresso</span>
                  <span>
                    {progress.completed}/{progress.total} passaggi
                  </span>
                </div>
                <Progress value={progress.percentage} className="h-2" />
                <div className="text-xs text-muted-foreground text-center">
                  {progress.percentage}% completato
                </div>
              </div>
            )}

          {/* Job details */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Creato:</span>
              <p className="font-medium">{formatDate(job.created_at)}</p>
            </div>
            {job.started_at && (
              <div>
                <span className="text-muted-foreground">Avviato:</span>
                <p className="font-medium">{formatDate(job.started_at)}</p>
              </div>
            )}
            {job.completed_at && (
              <div>
                <span className="text-muted-foreground">Completato:</span>
                <p className="font-medium">{formatDate(job.completed_at)}</p>
              </div>
            )}
            {job.started_at && (
              <div>
                <span className="text-muted-foreground">Durata:</span>
                <p className="font-medium">
                  {getDuration(job.started_at, job.completed_at) ||
                    "In corso..."}
                </p>
              </div>
            )}
          </div>

          {/* Error message */}
          {job.error_message && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{job.error_message}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export const JobMonitor = () => {
  const { user } = useAuth();
  const { jobs, activeJobs, recentJobs, isLoading, error, cancelJob } =
    useJobNotifications({
      showToasts: true,
      userId: user?.id,
    });

  const handleCancelJob = async (jobId: string) => {
    try {
      await cancelJob(jobId);
    } catch (error) {
      console.error("Error cancelling job:", error);
    }
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Accedi per visualizzare i tuoi workflow
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-muted-foreground">
            Caricamento workflow...
          </p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-red-600">
            Errore nel caricamento dei workflow: {error}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Active Jobs */}
      {activeJobs.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Workflow Attivi</h3>
          <div className="space-y-3">
            {activeJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onCancel={handleCancelJob}
                showProgress={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent Jobs */}
      {recentJobs.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Workflow Recenti</h3>
          <div className="space-y-3">
            {recentJobs.slice(0, 5).map((job) => (
              <JobCard key={job.id} job={job} showProgress={false} />
            ))}
          </div>
        </div>
      )}

      {/* No Jobs */}
      {jobs.length === 0 && (
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-muted-foreground">
              Nessun workflow trovato
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
