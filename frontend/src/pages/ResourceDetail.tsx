import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Book,
  Download,
  Share2,
  Calendar,
  User,
  ExternalLink,
  Cog,
  Youtube,
  FileText,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import type { Resource } from "@/types/resource";
import { resourceService } from "@/services/resourceService";

const ResourceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [resource, setResource] = useState<Resource | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate API call - in the future this will be a real API call
    const loadResource = async () => {
      setIsLoading(true);

      try {
        const foundResource = await resourceService.getResourceById(id!);
        setResource(foundResource);
      } catch (error) {
        console.error("Error loading resource:", error);
        setResource(null);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadResource();
    }
  }, [id]);

  const getContentTypeIcon = (contentType: string) => {
    return contentType === "youtube" ? (
      <Youtube className="h-4 w-4 text-red-500" />
    ) : (
      <FileText className="h-4 w-4 text-blue-500" />
    );
  };

  const getTagColor = (tag: string) => {
    // Same hash function as in ResourceCard for consistency
    const hash = tag.split("").reduce((a, b) => {
      a = (a << 5) - a + b.charCodeAt(0);
      return a & a;
    }, 0);

    const colors = [
      "bg-blue-100 text-blue-800",
      "bg-green-100 text-green-800",
      "bg-yellow-100 text-yellow-800",
      "bg-red-100 text-red-800",
      "bg-purple-100 text-purple-800",
      "bg-pink-100 text-pink-800",
      "bg-indigo-100 text-indigo-800",
    ];

    return colors[Math.abs(hash) % colors.length];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleShare = async () => {
    if (navigator.share && resource) {
      try {
        await navigator.share({
          title: resource.title,
          text: resource.summary,
          url: window.location.href,
        });
      } catch (error) {
        // Fallback to copying URL to clipboard
        navigator.clipboard.writeText(window.location.href);
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      navigator.clipboard.writeText(window.location.href);
    }
  };

  const handleDeleteResource = async () => {
    if (
      resource &&
      window.confirm(
        `Are you sure you want to delete "${resource.title}"? This action cannot be undone.`
      )
    ) {
      try {
        // In the future this will be an API call
        // await resourceService.deleteResource(resource.id);

        // For now, just navigate back to dashboard
        // In real implementation, you might want to show a success message
        navigate("/dashboard");
      } catch (error) {
        console.error("Error deleting resource:", error);
        alert("Failed to delete resource. Please try again.");
      }
    }
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[data-collapsible=icon]:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <div className="flex items-center space-x-2">
                <div className="h-4 w-4 bg-muted animate-pulse rounded"></div>
                <div className="h-4 w-32 bg-muted animate-pulse rounded"></div>
              </div>
            </div>
            <div className="ml-auto px-3">
              <ModeToggle />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="grid auto-rows-min gap-4 md:grid-cols-3">
              <div className="aspect-video rounded-xl bg-muted/50 animate-pulse" />
              <div className="aspect-video rounded-xl bg-muted/50 animate-pulse" />
              <div className="aspect-video rounded-xl bg-muted/50 animate-pulse" />
            </div>
            <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 md:min-h-min animate-pulse" />
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!resource) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[data-collapsible=icon]:h-12">
            <div className="flex items-center gap-2 px-4">
              <SidebarTrigger className="-ml-1" />
              <Separator orientation="vertical" className="mr-2 h-4" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </Button>
            </div>
            <div className="ml-auto px-3">
              <ModeToggle />
            </div>
          </header>
          <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="rounded-full bg-muted/50 p-6 mb-4">
                <FileText className="h-12 w-12 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold tracking-tight mb-2">
                Resource Not Found
              </h2>
              <p className="text-muted-foreground mb-6">
                The resource you're looking for doesn't exist or may have been
                removed.
              </p>
              <Button onClick={() => navigate("/dashboard")}>
                Return to Dashboard
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
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[data-collapsible=icon]:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem className="hidden md:block">
                  <BreadcrumbLink
                    onClick={() => navigate("/dashboard")}
                    className="cursor-pointer"
                  >
                    Dashboard
                  </BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator className="hidden md:block" />
                <BreadcrumbItem>
                  <BreadcrumbPage>Resource Details</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
          <div className="ml-auto px-3">
            <ModeToggle />
          </div>
        </header>

        <div className="flex-1 space-y-4 p-4 pt-0">
          <div className="my-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 mb-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </div>

          <section className="py-4">
            <div className="container grid gap-12 md:grid-cols-12 md:gap-8">
              {/* Sidebar */}
              <div className="order-last md:order-none md:col-span-4 lg:col-span-3">
                <aside className="flex flex-col gap-6">
                  {/* Resource Info */}
                  <div className="border-border bg-card overflow-hidden rounded-lg border shadow-sm">
                    <div className="border-border bg-muted/50 border-b px-5 py-4">
                      <h3 className="flex items-center text-sm font-semibold">
                        {getContentTypeIcon(resource.content_type)}
                        <span className="ml-2.5 capitalize font-mono">
                          {resource.content_type}
                        </span>
                      </h3>
                    </div>
                    <div className="p-5 space-y-4">
                      <div>
                        <h4 className="text-sm font-medium mb-2">Author</h4>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <User className="h-3 w-3 mr-2" />
                          {resource.author}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-2">Published</h4>
                        <div className="flex items-center text-sm text-muted-foreground">
                          <Calendar className="h-3 w-3 mr-2" />
                          {formatDate(resource.published_date)}
                        </div>
                      </div>

                      <div>
                        <h4 className="text-sm font-medium mb-2">Tags</h4>
                        <div className="flex flex-wrap gap-1">
                          {resource.tags.map((tag, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className={`text-xs ${getTagColor(
                                tag
                              )} cursor-default pointer-events-none`}
                            >
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="border-border bg-card overflow-hidden rounded-lg border shadow-sm">
                    <div className="border-border bg-muted/50 border-b px-5 py-4">
                      <h3 className="flex items-center text-sm font-semibold font-mono">
                        <Cog className="text-muted-foreground mr-2.5 size-4 text-gray-300" />
                        Actions
                      </h3>
                    </div>
                    <div className="p-5 space-y-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 justify-between"
                          onClick={() =>
                            window.open(resource.source_url, "_blank")
                          }
                        >
                          View Original
                          <ExternalLink className="ml-2 size-3" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="flex-1 justify-between"
                          onClick={handleShare}
                        >
                          Share
                          <Share2 className="ml-2 size-3" />
                        </Button>
                      </div>
                      <Button
                        className="w-full justify-between"
                        variant="destructive"
                        onClick={handleDeleteResource}
                      >
                        Delete Resource
                        <Trash2 className="ml-2 size-4" />
                      </Button>
                    </div>
                  </div>
                </aside>
              </div>

              {/* Main Content */}
              <div className="md:col-span-8 lg:col-span-9">
                <article className="prose dark:prose-invert prose-lg max-w-none">
                  <h1 className="text-4xl font-bold mb-6">{resource.title}</h1>

                  <div className="not-prose mb-8 p-6 border rounded-lg bg-muted/30">
                    <h2 className="text-lg font-semibold mb-3">Summary</h2>
                    <p className="text-muted-foreground leading-relaxed">
                      {resource.summary}
                    </p>
                  </div>

                  {/* Content placeholder - in real implementation this would be the processed content */}
                  <div className="space-y-6">
                    <h3>Key Points</h3>
                    <ul>
                      <li>Main concepts and ideas from the resource</li>
                      <li>Important takeaways and insights</li>
                      <li>Actionable information and recommendations</li>
                      <li>Related topics and further reading suggestions</li>
                    </ul>

                    <h3>Additional Information</h3>
                    <p className="text-muted-foreground">
                      Resource added on: {formatDate(resource.processed_at)}
                    </p>
                  </div>
                </article>
              </div>
            </div>
          </section>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export default ResourceDetail;
