import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { collectionService } from "@/services/collectionService";
import { useToast } from "@/hooks/use-toast";
import type { Collection, CreateCollectionRequest } from "@/types/collection";
import {
  FolderPlus,
  Plus,
  MoreVertical,
  Users,
  Lock,
  Calendar,
  Hash,
} from "lucide-react";

export default function Collections() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [nameError, setNameError] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3B82F6",
    is_public: false,
  });

  // Color options for collections
  const colorOptions = [
    { value: "#3B82F6", name: "Blue", border: "#2563EB" },
    { value: "#10B981", name: "Green", border: "#059669" },
    { value: "#8B5CF6", name: "Purple", border: "#7C3AED" },
    { value: "#F59E0B", name: "Orange", border: "#D97706" },
    { value: "#EF4444", name: "Red", border: "#DC2626" },
    { value: "#6B7280", name: "Gray", border: "#4B5563" },
  ];

  // Load collections
  useEffect(() => {
    const loadCollections = async () => {
      try {
        const data = await collectionService.getAllCollections();
        setCollections(data);
      } catch (error) {
        console.error("Error loading collections:", error);
        toast({
          title: "Error",
          description: "Failed to load collections. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadCollections();
  }, [toast]);

  const handleCreateCollection = async () => {
    // Reset error state
    setNameError(false);

    if (!formData.name.trim()) {
      setNameError(true);
      toast({
        title: "Error",
        description: "Collection name is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      const createData: CreateCollectionRequest = {
        name: formData.name,
        description: formData.description || undefined,
        color: formData.color,
        user_id: "current-user", // Will be set by service
        is_public: formData.is_public,
      };

      const newCollection = await collectionService.createCollection(
        createData
      );
      setCollections([newCollection, ...collections]);

      // Reset form
      setFormData({
        name: "",
        description: "",
        color: "#3B82F6",
        is_public: false,
      });
      setNameError(false);
      setIsCreateDialogOpen(false);

      toast({
        title: "Success",
        description: "Collection created successfully.",
        variant: "success",
      });
    } catch (error) {
      console.error("Error creating collection:", error);
      toast({
        title: "Error",
        description: "Failed to create collection. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCollection = async (id: string) => {
    try {
      await collectionService.deleteCollection(id);
      setCollections(collections.filter((c) => c.id !== id));

      toast({
        title: "Success",
        description: "Collection deleted successfully.",
        variant: "success",
      });
    } catch (error) {
      console.error("Error deleting collection:", error);
      toast({
        title: "Error",
        description: "Failed to delete collection. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleViewCollection = (id: string) => {
    navigate(`/collection/${id}`);
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading collections...</p>
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
                  <BreadcrumbLink href="#">Collections</BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>My Collections</BreadcrumbPage>
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-bold text-absolute">
                My Collections
              </h1>
              <p className="text-muted-absolute">
                Organize your resources into custom collections
              </p>
            </div>

            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={(open) => {
                setIsCreateDialogOpen(open);
                if (!open) {
                  // Reset form and error when dialog closes
                  setFormData({
                    name: "",
                    description: "",
                    color: "#3B82F6",
                    is_public: false,
                  });
                  setNameError(false);
                }
              }}
            >
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4" />
                  New Collection
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-[calc(100vw-2rem)] sm:max-w-[425px] rounded-lg">
                <DialogHeader className="text-center space-y-4">
                  <DialogTitle className="text-center text-lg font-semibold">
                    Create New Collection
                  </DialogTitle>
                  <DialogDescription className="text-center text-muted-foreground leading-relaxed">
                    Create a new collection to organize your resources.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <FloatingLabelInput
                    id="name"
                    label="Name"
                    required
                    error={nameError}
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      // Clear error when user starts typing
                      if (nameError) setNameError(false);
                    }}
                  />
                  <FloatingLabelInput
                    id="description"
                    label="Description"
                    value={formData.description}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFormData({
                        ...formData,
                        description: e.target.value,
                      })
                    }
                  />
                  <div className="space-y-2">
                    <Label htmlFor="color" className="text-sm font-medium">
                      Color
                    </Label>
                    <div className="flex gap-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color.value}
                          className={`w-8 h-8 rounded-full border-2 max-md:border-[1px] transition-all duration-200 ${
                            formData.color === color.value
                              ? "border-foreground shadow-md"
                              : ""
                          }`}
                          style={{
                            backgroundColor: color.value,
                            borderColor:
                              formData.color === color.value
                                ? undefined
                                : color.border,
                          }}
                          onClick={() =>
                            setFormData({ ...formData, color: color.value })
                          }
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter className="grid grid-cols-2 gap-2 mt-4">
                  <Button
                    className="w-full hover:bg-muted/50 hover:text-muted-foreground"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleCreateCollection} className="w-full">
                    Create Collection
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Collections Grid */}
          {collections.length === 0 ? (
            <Card className="col-span-full">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <div className="rounded-full p-6 mb-4 border-2 max-md:border-[1px] border-[hsl(var(--primary-intense))]/20 dark:border-[hsl(var(--primary-intense))]/90 bg-[#1a58ea1a]/20 dark:bg-[#1a58ea1a]/40">
                  <FolderPlus className="h-12 w-12 text-[#387EF5]" />
                </div>
                <h3 className="text-lg font-medium mb-2">No collections yet</h3>
                <p className="text-muted-foreground text-center max-w-md mb-4">
                  Create your first collection to organize your resources into
                  custom groups.
                </p>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Create Collection
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {collections.map((collection) => (
                <Card
                  key={collection.id}
                  className="transition-all hover:shadow-lg cursor-pointer"
                  onClick={() => handleViewCollection(collection.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: collection.color }}
                        />
                        <div>
                          <CardTitle className="text-lg">
                            {collection.name}
                          </CardTitle>
                          {collection.description && (
                            <CardDescription className="mt-1">
                              {collection.description}
                            </CardDescription>
                          )}
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          asChild
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewCollection(collection.id);
                            }}
                          >
                            View Collection
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCollection(collection.id);
                            }}
                            className="text-destructive"
                          >
                            Delete Collection
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Resources</span>
                        <Badge variant="default">
                          {collection.resource_count}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          {collection.is_public ? (
                            <Users className="h-3 w-3" />
                          ) : (
                            <Lock className="h-3 w-3" />
                          )}
                          <span>
                            {collection.is_public ? "Public" : "Private"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>
                            {new Date(
                              collection.created_date
                            ).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      {collection.tags && collection.tags.length > 0 && (
                        <div className="flex items-center gap-2 flex-wrap">
                          <Hash className="h-3 w-3 text-muted-foreground" />
                          {collection.tags.slice(0, 3).map((tag) => (
                            <Badge
                              key={tag}
                              variant="outline"
                              className="text-xs"
                            >
                              {tag}
                            </Badge>
                          ))}
                          {collection.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{collection.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
