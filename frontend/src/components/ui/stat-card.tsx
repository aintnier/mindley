import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  value: string | number;
  title: string;
  icon: LucideIcon;
  colorScheme: {
    icon: string;
    background: string;
    border: string;
  };
  change?: number;
}

export function StatCard({
  value,
  title,
  icon: Icon,
  colorScheme,
  change,
}: StatCardProps) {
  const renderChangeIndicator = (change: number | undefined) => {
    if (change === undefined) return null;

    if (change === 0) {
      return (
        <div className="flex items-center text-xs text-muted-foreground/70 mt-2 md:mt-2">
          <Minus className="h-4 w-4 md:h-4 md:w-4 mr-1" />
          <span className="text-xs font-semibold">No change</span>
        </div>
      );
    }

    const isPositive = change > 0;
    const colorClass = isPositive
      ? "text-green-600 dark:text-green-400"
      : "text-red-600 dark:text-red-400";

    return (
      <div className={cn("flex items-center text-xs mt-2 md:mt-2", colorClass)}>
        {isPositive ? (
          <TrendingUp className="h-4 w-4 md:h-4 md:w-6 mr-1" />
        ) : (
          <TrendingDown className="h-4 w-4 md:h-4 md:w-6 mr-1" />
        )}
        <span className="text-xs font-semibold">
          {isPositive ? "+" : ""}
          {change.toFixed(1)}%
        </span>
      </div>
    );
  };

  return (
    <Card className="transition-all duration-300 hover:shadow-md">
      <CardContent className="p-3 md:p-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-lg md:text-2xl font-bold">{value}</div>
            <div className="text-xs md:text-sm font-medium text-muted-foreground">
              {title}
            </div>
            {renderChangeIndicator(change)}
          </div>
          <div
            className={cn(
              "h-8 w-8 md:h-12 md:w-12 rounded-full flex items-center justify-center p-1 md:p-2 self-start border-2 max-md:border-[1px]",
              colorScheme.icon,
              colorScheme.background,
              colorScheme.border
            )}
          >
            <Icon className="h-4 w-4 md:h-6 md:w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
