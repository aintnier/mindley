import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { startOfWeek, endOfWeek, subWeeks } from "date-fns";
import { AppSidebar } from "@/components/app-sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { AddResourceForm } from "@/components/add-resource-form";
import { StatsOverview } from "@/components/stats-overview";
import { RecentResources } from "@/components/recent-resources";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { resourceService } from "@/services/resourceService";
import { useToast } from "@/hooks/use-toast";
import { useJobNotifications } from "@/hooks/use-job-notifications";
import type { Resource, CreateResourceRequest } from "@/types/resource";

export default function Dashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const getToastVariant = (type: string) => {
    switch (type) {
      case "job_completed":
        return "default" as const;
      case "job_failed":
        return "destructive" as const;
      case "step_updated":
        return "default" as const;
      case "resource_ready":
        return "success" as const;
      default:
        return "default" as const;
    }
  };
  const [resources, setResources] = useState<Resource[]>([]);
  const [isAddingResource, setIsAddingResource] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);

  // Initialize job notifications
  useJobNotifications({
    showToasts: true,
    userId: user?.id,
  });

  // Load user & resources with polling fallback
  const previousResourceIdsRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    let cancelled = false;
    let interval: number | null = null;

    const fetchUser = async () => {
      try {
        const {
          data: { user: supaUser },
        } = await import("@/lib/supabase").then((m) =>
          m.supabase.auth.getUser()
        );
        if (!cancelled) setUser(supaUser || null);
      } catch {
        /* ignore */
      }
    };

    const loadResources = async () => {
      try {
        const data = await resourceService.getAllResources();
        if (cancelled) return;
        // detect new resources for toast
        const currentIds = new Set(data.map((r) => r.id));
        data.forEach((r) => {
          if (r.id && !previousResourceIdsRef.current.has(r.id)) {
            if (previousResourceIdsRef.current.size > 0) {
              toast({
                title: "Resource ready!",
                description:
                  "A new resource has been processed and is now available.",
                duration: 6000,
                variant: getToastVariant("resource_ready"),
              });
            }
          }
        });
        previousResourceIdsRef.current = currentIds;
        setResources(data);
      } catch (e) {
        console.error("Error loading resources", e);
      }
    };

    fetchUser();
    loadResources();
    interval = window.setInterval(loadResources, 5000) as unknown as number;
    return () => {
      cancelled = true;
      if (interval) window.clearInterval(interval);
    };
  }, [toast]);

  // Calculate stats
  const stats = useMemo(() => {
    const total = resources.length;
    const youtube = resources.filter(
      (r) => r.content_type === "youtube"
    ).length;
    const articles = resources.filter(
      (r) => r.content_type === "article"
    ).length;

    return { total, youtube, articles };
  }, [resources]);

  // Calculate comparative stats (vs previous calendar week)
  const comparisons = useMemo(() => {
    const now = new Date();

    // Define current week boundaries (Monday to Sunday)
    const currentWeekStart = startOfWeek(now, { weekStartsOn: 1 });
    const currentWeekEnd = endOfWeek(now, { weekStartsOn: 1 });

    // Define previous week boundaries
    const previousWeekStart = startOfWeek(subWeeks(now, 1), {
      weekStartsOn: 1,
    });
    const previousWeekEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });

    // Current week resources
    const currentWeekResources = resources.filter((r) => {
      const resourceDate = new Date(r.processed_date);
      return resourceDate >= currentWeekStart && resourceDate <= currentWeekEnd;
    });

    // Previous week resources
    const previousWeekResources = resources.filter((r) => {
      const resourceDate = new Date(r.processed_date);
      return (
        resourceDate >= previousWeekStart && resourceDate <= previousWeekEnd
      );
    });

    // Current week counts by type
    const currentWeekTotal = currentWeekResources.length;
    const currentWeekYoutube = currentWeekResources.filter(
      (r) => r.content_type === "youtube"
    ).length;
    const currentWeekArticles = currentWeekResources.filter(
      (r) => r.content_type === "article"
    ).length;

    // Previous week counts by type
    const previousWeekTotal = previousWeekResources.length;
    const previousWeekYoutube = previousWeekResources.filter(
      (r) => r.content_type === "youtube"
    ).length;
    const previousWeekArticles = previousWeekResources.filter(
      (r) => r.content_type === "article"
    ).length;

    // Calculate percentage changes
    const calculateChange = (current: number, previous: number): number => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    return {
      totalChange: calculateChange(currentWeekTotal, previousWeekTotal),
      youtubeChange: calculateChange(currentWeekYoutube, previousWeekYoutube),
      articlesChange: calculateChange(
        currentWeekArticles,
        previousWeekArticles
      ),
    };
  }, [resources]);

  // Get recent resources (last 6)
  const recentResources = useMemo(() => {
    return [...resources]
      .sort(
        (a, b) =>
          new Date(b.processed_date).getTime() -
          new Date(a.processed_date).getTime()
      )
      .slice(0, 6);
  }, [resources]);

  const handleAddResource = async (data: CreateResourceRequest) => {
    if (!user) return;
    setIsAddingResource(true);

    try {
      toast({
        title: "Processing started!",
        description:
          "Workflow started. You will receive notifications during processing.",
        duration: 6000,
        variant: "default",
      });

      await resourceService.createResource({
        ...data,
        user_id: user.id,
      });
    } catch (error) {
      console.error("Error starting resource processing:", error);
      toast({
        title: "Error",
        description: "Failed to start processing. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAddingResource(false);
    }
  };

  const handleViewDetails = (id: string) => {
    navigate(`/resource/${id}`);
  };

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Overview</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto px-4">
            <ModeToggle />
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Header */}
          <div className="space-y-1 mb-4">
            <h1 className="text-2xl font-bold text-absolute">Overview</h1>
            <p className="text-muted-absolute">
              Monitor your activity and manage your resources efficiently.
            </p>
          </div>

          {/* Add Resource Form */}
          <AddResourceForm
            onSubmit={handleAddResource}
            isLoading={isAddingResource}
          />

          {/* Stats Overview */}
          <StatsOverview stats={stats} comparisons={comparisons} />

          {/* Recent Resources */}
          <RecentResources
            recentResources={recentResources}
            onViewDetails={handleViewDetails}
          />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
