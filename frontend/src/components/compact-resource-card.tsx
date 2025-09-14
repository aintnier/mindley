import { FileText } from "lucide-react";
import YouTubeIcon from "@/components/icons/youtube";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Resource } from "@/types/resource";

interface CompactResourceCardProps {
  resource: Resource;
}

export function CompactResourceCard({ resource }: CompactResourceCardProps) {
  const getContentTypeIcon = () => {
    return resource.content_type === "youtube" ? (
      <YouTubeIcon className="h-4 w-4 text-red-500" />
    ) : (
      <FileText className="h-4 w-4 text-blue-500" />
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

  const truncateSummary = (summary: string, maxLength: number = 80) => {
    if (summary.length <= maxLength) return summary;
    return summary.substring(0, maxLength) + "...";
  };

  const imageAlt = resource.title
    ? `${resource.title} thumbnail`
    : "Image unavailable";

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow duration-200 w-full max-w-[18rem] overflow-hidden">
      <div className="w-full aspect-[16/9] bg-muted flex items-center justify-center text-center overflow-hidden">
        {resource.thumbnail_link ? (
          <img
            src={resource.thumbnail_link}
            alt={imageAlt}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <span className="text-[10px] text-muted-foreground px-2 text-center leading-snug flex items-center justify-center w-full h-full">
            {imageAlt}
          </span>
        )}
      </div>

      <CardHeader className="space-y-0 p-3 pb-1">
        {/* min-w-0 here allows the title to actually truncate within a flex row */}
        <div className="flex items-center space-x-2 min-w-0">
          <div className="h-[20px] flex-shrink-0">{getContentTypeIcon()}</div>
          <CardTitle className="text-sm leading-tight truncate flex-1 min-h-[1.25rem] min-w-0">
            {resource.title}
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-3 pt-1 flex flex-col">
        <div className="text-xs text-muted-foreground leading-relaxed mb-3">
          <p className="line-clamp-4">
            {truncateSummary(resource.summary, 200)}
          </p>
        </div>

        <div className="mt-auto">
          {/* min-w-0 avoids tag row forcing a wider min-content size */}
          <div className="relative flex items-center gap-1 overflow-hidden min-w-0">
            {resource.tags.slice(0, 2).map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className={`text-[10px] px-1.5 py-0.5 h-auto flex-shrink-0 ${getTagColor(
                  tag
                )} cursor-default pointer-events-none`}
              >
                {tag}
              </Badge>
            ))}

            {resource.tags.length > 2 && (
              <Badge
                variant="outline"
                className="text-[10px] px-1.5 py-0.5 h-auto flex-shrink-0 cursor-default pointer-events-none"
              >
                +{resource.tags.length - 2}
              </Badge>
            )}

            {/* Gradient fade effect for overflowing tags */}
            <div className="absolute right-0 top-0 bottom-0 w-4 bg-gradient-to-l from-card to-transparent pointer-events-none" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
