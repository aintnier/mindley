import { useState, useMemo, useEffect } from "react";
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
import { createClient } from "@supabase/supabase-js";
import type { Resource, CreateResourceRequest } from "@/types/resource";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Dashboard() {
  const { toast } = useToast();
  const navigate = useNavigate();
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

  // Load resources and setup realtime subscription
  useEffect(() => {
    let subscription: ReturnType<typeof supabase.channel> | null = null;

    const loadResources = () => {
      resourceService
        .getAllResources()
        .then((data) => {
          setResources(data);
        })
        .catch(console.error);
    };

    loadResources();

    // Realtime setup with retry logic
    const setupRealtime = async () => {
      try {
        const {
          data: { user: supaUser },
        } = await supabase.auth.getUser();
        if (!supaUser) return;
        setUser(supaUser);

        subscription = supabase
          .channel(`resources-${supaUser.id}-${Date.now()}`)
          .on(
            "postgres_changes",
            {
              event: "INSERT",
              schema: "public",
              table: "resources",
            },
            (payload) => {
              console.log("[Realtime] INSERT event received:", payload);
              // Check if the resource belongs to the current user
              if (payload.new && payload.new.user_id === supaUser.id) {
                loadResources();
                toast({
                  title: "Resource ready!",
                  description:
                    "A new resource has been processed and is now available in your dashboard.",
                  duration: 6000,
                  variant: "default",
                });
              }
            }
          )
          .subscribe((status, err) => {
            console.log("[Realtime] Subscription status:", status, err);
          });
      } catch (err) {
        console.error("[Realtime] Setup error:", err);
      }
    };

    setupRealtime();

    return () => {
      if (subscription) supabase.removeChannel(subscription);
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
          aValue = new Date(a.published_date ?? "");
          bValue = new Date(b.published_date ?? "");
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
    toast({
      title: "Processing resource...",
      description:
        "Your resource is being processed. It will appear automatically in the dashboard when ready.",
      duration: 6000,
      variant: "default",
    });
    try {
      await resourceService.createResource({
        ...data,
        user_id: user.id,
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
              <div className="flex flex-wrap gap-6">
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
