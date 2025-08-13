import { Calendar, ExternalLink, User, Youtube, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Resource } from "@/types/resource";

interface ResourceCardProps {
  resource: Resource;
  onViewDetails: (id: string) => void;
}

export function ResourceCard({ resource, onViewDetails }: ResourceCardProps) {
  const getContentTypeIcon = () => {
    return resource.content_type === "youtube" ? (
      <Youtube className="h-5 w-5 text-red-500" />
    ) : (
      <FileText className="h-5 w-5 text-blue-500" />
    );
  };

  const getTagColor = (tag: string) => {
    // Simple hash function to get consistent colors for tags
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
      month: "short",
      day: "numeric",
    });
  };

  const truncateSummary = (summary: string, maxLength: number = 150) => {
    if (summary.length <= maxLength) return summary;
    return summary.substring(0, maxLength) + "...";
  };

  return (
    <Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="space-y-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            {getContentTypeIcon()}
            <span className="text-xs font-medium text-muted-foreground uppercase">
              {resource.content_type}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.open(resource.link, "_blank")}
            className="h-8 w-8 p-0"
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        </div>
        <div>
          <CardTitle className="text-lg leading-tight line-clamp-2">
            {resource.title}
          </CardTitle>
          <CardDescription className="flex items-center space-x-2 mt-2">
            <User className="h-3 w-3" />
            <span>{resource.author}</span>
            <span>•</span>
            <Calendar className="h-3 w-3" />
            <span>{formatDate(resource.published_date ?? "")}</span>
          </CardDescription>
        </div>
      </CardHeader>

      {resource.thumbnail_link && (
        <img
          src={resource.thumbnail_link}
          alt="Resource thumbnail"
          className="w-full h-40 object-cover rounded-b-none rounded-t-lg"
          style={{ objectFit: "cover" }}
        />
      )}

      <CardContent className="flex-1">
        <p className="text-sm text-muted-foreground leading-relaxed">
          {truncateSummary(resource.summary)}
        </p>

        <div className="flex flex-wrap gap-1 mt-4">
          {resource.tags.slice(0, 3).map((tag, index) => (
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
          {resource.tags.length > 3 && (
            <Badge
              variant="outline"
              className="text-xs cursor-default pointer-events-none"
            >
              +{resource.tags.length - 3}
            </Badge>
          )}
        </div>
      </CardContent>

      <CardFooter className="pt-4">
        <Button
          onClick={() => onViewDetails(resource.id)}
          className="w-full"
          variant="outline"
        >
          View Details
        </Button>
      </CardFooter>
    </Card>
  );
}
