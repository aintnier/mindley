import { useState, useMemo, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/app-sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { ResourceCard } from "@/components/resource-card";
import { AddResourceForm } from "@/components/add-resource-form";
import { CompactResourceFilters } from "@/components/compact-resource-filters";
import type { FilterOptions } from "@/components/compact-resource-filters";
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

// Realtime logic removed: handled by hooks (useJobNotifications + future reliable hooks)

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
  const [filters, setFilters] = useState<FilterOptions>({
    search: "",
    contentType: "all",
    sortBy: "date",
    sortOrder: "desc",
    selectedTags: [],
  });
  const [user, setUser] = useState<any>(null);

  // Initialize job notifications
  useJobNotifications({
    showToasts: true,
    userId: user?.id,
  });

  // Load user & resources with polling fallback (replaces inline realtime here)
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
      } catch (e) {
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

  // Extract all unique tags from resources
  const availableTags = useMemo(() => {
    const allTags = resources.flatMap((resource) => resource.tags);
    return Array.from(new Set(allTags)).sort();
  }, [resources]);

  // Calculate tag counts
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    resources.forEach((resource) => {
      resource.tags.forEach((tag) => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return counts;
  }, [resources]);

  // Filter and sort resources
  const filteredResources = useMemo(() => {
    const filtered = resources.filter((resource) => {
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase();
        const matchesSearch =
          resource.title.toLowerCase().includes(searchLower) ||
          (resource.author ?? "").toLowerCase().includes(searchLower) ||
          resource.summary.toLowerCase().includes(searchLower) ||
          resource.tags.some((tag) => tag.toLowerCase().includes(searchLower));

        if (!matchesSearch) return false;
      }

      // Content type filter
      if (
        filters.contentType !== "all" &&
        resource.content_type !== filters.contentType
      ) {
        return false;
      }

      // Tags filter
      if (filters.selectedTags.length > 0) {
        const hasSelectedTag = filters.selectedTags.some((tag) =>
          resource.tags.includes(tag)
        );
        if (!hasSelectedTag) return false;
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: string | Date;
      let bValue: string | Date;

      switch (filters.sortBy) {
        case "date":
          aValue = new Date(a.processed_date ?? "");
          bValue = new Date(b.processed_date ?? "");
          break;
        case "title":
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case "author":
          aValue = (a.author ?? "").toLowerCase();
          bValue = (b.author ?? "").toLowerCase();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) return filters.sortOrder === "asc" ? -1 : 1;
      if (aValue > bValue) return filters.sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [resources, filters]);

  const handleAddResource = async (data: CreateResourceRequest) => {
    if (!user) return;
    setIsAddingResource(true);

    try {
      // Job creation now delegated entirely to n8n (avoid duplicate jobs)
      toast({
        title: "Processing started!",
        description:
          "Workflow started. You will receive notifications during processing.",
        duration: 6000,
        variant: "default",
      });

      // Start the resource creation process
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
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mr-2 data-[orientation=vertical]:h-4"
            />
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

        <div className="flex flex-1 flex-col gap-6 p-4 pt-0">
          {/* Add Resource Form */}
          <div className="w-full">
            <AddResourceForm
              onSubmit={handleAddResource}
              isLoading={isAddingResource}
            />
          </div>

          {/* Filters */}
          <CompactResourceFilters
            filters={filters}
            onFiltersChange={setFilters}
            availableTags={availableTags}
            tagCounts={tagCounts}
            resultCount={filteredResources.length}
          />

          {/* Resources Grid */}
          <div className="flex-1">
            {filteredResources.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
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
                <h3 className="text-lg font-medium mb-2">No resources found</h3>
                <p className="text-muted-foreground max-w-md">
                  {filters.search ||
                  filters.contentType !== "all" ||
                  filters.selectedTags.length > 0
                    ? "There are no resources matching the selected filters. Try adjusting your search criteria."
                    : "Start by adding your first resource using the form above."}
                </p>
              </div>
            ) : (
              <div className="flex flex-wrap gap-6 max-sm:justify-center">
                {filteredResources.map((resource) => (
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
