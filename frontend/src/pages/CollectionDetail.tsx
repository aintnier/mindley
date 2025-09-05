import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/app-sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { ResourceCard } from "@/components/resource-card";

import { collectionService } from "@/services/collectionService";
import { resourceService } from "@/services/resourceService";
import { useToast } from "@/hooks/use-toast";
import type { CollectionWithResources } from "@/types/collection";
import type { Resource } from "@/types/resource";
import {
  ArrowLeft,
  Plus,
  Users,
  Lock,
  Calendar,
  Hash,
  Trash2,
} from "lucide-react";

export default function CollectionDetail() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [collection, setCollection] = useState<CollectionWithResources | null>(
    null
  );
  const [collectionResources, setCollectionResources] = useState<Resource[]>(
    []
  );
  const [isLoading, setIsLoading] = useState(true);
  const [availableResources, setAvailableResources] = useState<Resource[]>([]);
  const [isAddingResource, setIsAddingResource] = useState(false);

  // Load collection and its resources
  useEffect(() => {
    if (!id) return;

    const loadCollectionData = async () => {
      try {
        // Load collection metadata
        const collectionData =
          await collectionService.getCollectionWithResources(id);
        setCollection(collectionData);

        // Load full resource data for resources in this collection
        if (
          collectionData &&
          collectionData.resources &&
          collectionData.resources.length > 0
        ) {
          const allResources = await resourceService.getAllResources();
          const resourceIds = collectionData.resources.map((r) => r.id);
          const fullResources = allResources.filter((resource) =>
            resourceIds.includes(resource.id)
          );
          setCollectionResources(fullResources);
        } else {
          setCollectionResources([]);
        }
      } catch (error) {
        console.error("Error loading collection:", error);
        toast({
          title: "Error",
          description: "Failed to load collection. Please try again.",
          variant: "destructive",
        });
        navigate("/collections");
      } finally {
        setIsLoading(false);
      }
    };

    loadCollectionData();
  }, [id, toast, navigate]);

  // Load available resources when adding mode is enabled
  useEffect(() => {
    if (!isAddingResource) return;

    const loadAvailableResources = async () => {
      try {
        const allResources = await resourceService.getAllResources();
        // Filter out resources already in the collection
        const collectionResourceIds = collectionResources.map((r) => r.id);
        const filtered = allResources.filter(
          (r) => !collectionResourceIds.includes(r.id)
        );
        setAvailableResources(filtered);
      } catch (error) {
        console.error("Error loading available resources:", error);
        toast({
          title: "Error",
          description: "Failed to load available resources.",
          variant: "destructive",
        });
      }
    };

    loadAvailableResources();
  }, [isAddingResource, collectionResources, toast]);

  const handleAddResource = async (resourceId: string) => {
    if (!id) return;

    try {
      await collectionService.addResourceToCollection(id, resourceId);

      // Reload collection and resources
      const updatedCollection =
        await collectionService.getCollectionWithResources(id);
      setCollection(updatedCollection);

      // Reload full resource data
      if (updatedCollection) {
        const allResources = await resourceService.getAllResources();
        const resourceIds = updatedCollection.resources?.map((r) => r.id) || [];
        const fullResources = allResources.filter((resource) =>
          resourceIds.includes(resource.id)
        );
        setCollectionResources(fullResources);
      }

      toast({
        title: "Success",
        description: "Resource added to collection.",
        variant: "default",
      });

      setIsAddingResource(false);
    } catch (error) {
      console.error("Error adding resource to collection:", error);
      toast({
        title: "Error",
        description: "Failed to add resource to collection.",
        variant: "destructive",
      });
    }
  };

  const handleViewResource = (id: string) => {
    navigate(`/resource/${id}`);
  };

  const handleRemoveResource = async (resourceId: string) => {
    if (!id) return;

    try {
      await collectionService.removeResourceFromCollection(id, resourceId);

      // Reload collection and resources
      const updatedCollection =
        await collectionService.getCollectionWithResources(id);
      setCollection(updatedCollection);

      // Reload full resource data
      if (updatedCollection) {
        const allResources = await resourceService.getAllResources();
        const resourceIds = updatedCollection.resources?.map((r) => r.id) || [];
        const fullResources = allResources.filter((resource) =>
          resourceIds.includes(resource.id)
        );
        setCollectionResources(fullResources);
      }

      toast({
        title: "Success",
        description: "Resource removed from collection.",
        variant: "default",
      });
    } catch (error) {
      console.error("Error removing resource from collection:", error);
      toast({
        title: "Error",
        description: "Failed to remove resource from collection.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading collection...</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!collection) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Collection not found</h3>
              <p className="text-muted-foreground mb-4">
                The collection you're looking for doesn't exist or you don't
                have permission to view it.
              </p>
              <Button onClick={() => navigate("/collections")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Collections
              </Button>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

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
                  <BreadcrumbLink href="/collections">
                    Collections
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>{collection.name}</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto px-4">
            <ModeToggle />
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          {/* Collection Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/collections")}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: collection.color }}
                  />
                  <h1 className="text-3xl font-bold">{collection.name}</h1>
                </div>
                {collection.description && (
                  <p className="text-muted-foreground text-lg">
                    {collection.description}
                  </p>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    {collection.is_public ? (
                      <Users className="h-4 w-4" />
                    ) : (
                      <Lock className="h-4 w-4" />
                    )}
                    <span>{collection.is_public ? "Public" : "Private"}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Created{" "}
                      {new Date(collection.created_date).toLocaleDateString()}
                    </span>
                  </div>
                  <Badge variant="secondary">
                    {collectionResources.length} resources
                  </Badge>
                </div>

                {collection.tags && collection.tags.length > 0 && (
                  <div className="flex items-center gap-2 flex-wrap">
                    <Hash className="h-4 w-4 text-muted-foreground" />
                    {collection.tags.map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setIsAddingResource(!isAddingResource)}
              >
                <Plus className="h-4 w-4 mr-2" />
                {isAddingResource ? "Cancel" : "Add Resource"}
              </Button>
            </div>
          </div>

          {/* Resources Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold">Resources</h2>
              {collectionResources.length > 0 && (
                <span className="text-sm text-muted-foreground">
                  {collectionResources.length} resources
                </span>
              )}
            </div>

            {/* Add Resources Mode */}
            {isAddingResource && (
              <Card>
                <CardHeader>
                  <CardTitle>Add Resources to Collection</CardTitle>
                  <CardDescription>
                    Select resources to add to this collection.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {availableResources.length === 0 ? (
                    <p className="text-muted-foreground">
                      No available resources to add.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-4">
                      {availableResources.map((resource) => (
                        <div key={resource.id} className="relative">
                          <ResourceCard
                            resource={resource}
                            onViewDetails={handleViewResource}
                          />
                          <div className="absolute top-2 right-2">
                            <Button
                              size="sm"
                              onClick={() => handleAddResource(resource.id)}
                              className="h-8 w-8 p-0"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Collection Resources */}
            {collectionResources.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <div
                    className="rounded-full p-6 mb-4"
                    style={{ backgroundColor: "rgb(156 163 175 / 0.1)" }}
                  >
                    <Plus className="h-12 w-12 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium mb-2">No resources yet</h3>
                  <p className="text-muted-foreground text-center max-w-md mb-4">
                    This collection is empty. Add resources to start organizing
                    your content.
                  </p>
                  <Button onClick={() => setIsAddingResource(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Resources
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="flex flex-wrap gap-4">
                {collectionResources.map((resource) => (
                  <div
                    key={resource.id}
                    className="relative group flex-shrink-0 w-80"
                  >
                    <ResourceCard
                      resource={resource}
                      onViewDetails={handleViewResource}
                    />
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveResource(resource.id)}
                        className="h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
