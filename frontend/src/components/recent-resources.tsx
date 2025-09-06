import { Link } from "react-router-dom";
import { ResourceCard } from "@/components/resource-card";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Resource } from "@/types/resource";

interface RecentResourcesProps {
  recentResources: Resource[];
  onViewDetails: (id: string) => void;
}

export function RecentResources({
  recentResources,
  onViewDetails,
}: RecentResourcesProps) {
  return (
    <div className="space-y-4 mb-2">
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
              onViewDetails={onViewDetails}
            />
          ))}
        </div>
      )}
    </div>
  );
}
