import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AppSidebar } from "@/components/app-sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { ResourceCard } from "@/components/resource-card";
import { AddResourceForm } from "@/components/add-resource-form";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
    const thisWeek = resources.filter((r) => {
      const resourceDate = new Date(r.processed_date);
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      return resourceDate >= weekAgo;
    }).length;

    return { total, youtube, articles, thisWeek };
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
          {/* Add Resource Form */}
          <div className="w-full">
            <AddResourceForm
              onSubmit={handleAddResource}
              isLoading={isAddingResource}
            />
          </div>

          {/* Stats Overview */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="transition-all hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Resources
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-blue-100 p-2 dark:bg-blue-900">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-blue-600 dark:text-blue-400"
                  >
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                    <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
                  </svg>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">
                  Resources in your library
                </p>
              </CardContent>
            </Card>

            <Card className="transition-all hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  YouTube Videos
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-red-100 p-2 dark:bg-red-900">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-red-600 dark:text-red-400"
                  >
                    <polygon points="23 7 16 12 23 17 23 7" />
                    <rect width="14" height="14" x="1" y="5" rx="2" ry="2" />
                  </svg>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.youtube}</div>
                <p className="text-xs text-muted-foreground">
                  Video resources saved
                </p>
              </CardContent>
            </Card>

            <Card className="transition-all hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Articles</CardTitle>
                <div className="h-8 w-8 rounded-lg bg-green-100 p-2 dark:bg-green-900">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-green-600 dark:text-green-400"
                  >
                    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                  </svg>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.articles}</div>
                <p className="text-xs text-muted-foreground">
                  Article resources saved
                </p>
              </CardContent>
            </Card>

            <Card className="transition-all hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Added This Week
                </CardTitle>
                <div className="h-8 w-8 rounded-lg bg-purple-100 p-2 dark:bg-purple-900">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    className="h-4 w-4 text-purple-600 dark:text-purple-400"
                  >
                    <path d="M8 2v4" />
                    <path d="M16 2v4" />
                    <rect width="18" height="18" x="3" y="4" rx="2" />
                    <path d="M3 10h18" />
                  </svg>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.thisWeek}</div>
                <p className="text-xs text-muted-foreground">
                  Resources added recently
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Resources */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Recent Resources</h2>
                <p className="text-sm text-muted-foreground">
                  Your latest additions to the library
                </p>
              </div>
              <Button variant="outline" asChild>
                <Link to="/library">View All</Link>
              </Button>
            </div>

            {recentResources.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div className="rounded-full bg-muted/50 p-6 mb-4">
                    <svg
                      className="h-12 w-12 text-muted-foreground"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium mb-2">No resources yet</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    Start by adding your first resource using the form above.
                    Resources will appear here once processed.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-wrap gap-6 max-sm:justify-center">
                {recentResources.map((resource) => (
                  <ResourceCard
                    key={resource.id}
                    resource={resource}
                    onViewDetails={handleViewDetails}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
