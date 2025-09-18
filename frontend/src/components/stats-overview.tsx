import { BookCopy, FilePlay, FileText, Calendar } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";

interface StatsOverviewProps {
  stats: {
    total: number;
    youtube: number;
    articles: number;
  };
  comparisons?: {
    totalChange: number;
    youtubeChange: number;
    articlesChange: number;
  };
}

export function StatsOverview({ stats, comparisons }: StatsOverviewProps) {
  return (
    <div className="space-y-4 mb-2">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Stats Overview</h2>
          <p className="text-sm text-muted-foreground">
            A quick snapshot of your library
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          value={stats.total}
          title="Total Resources"
          icon={BookCopy}
          colorScheme={{
            icon: "text-blue-500 dark:text-blue-200",
            background: "bg-blue-100 dark:bg-blue-800",
            border: "border-blue-200 dark:border-blue-900",
          }}
          change={comparisons?.totalChange}
        />

        <StatCard
          value="n"
          title="Title"
          icon={Calendar}
          colorScheme={{
            icon: "text-purple-500 dark:text-purple-200",
            background: "bg-purple-100 dark:bg-purple-800",
            border: "border-purple-200 dark:border-purple-900",
          }}
        />

        <StatCard
          value={stats.youtube}
          title="YouTube Videos"
          icon={FilePlay}
          colorScheme={{
            icon: "text-red-500 dark:text-red-200",
            background: "bg-red-100 dark:bg-red-800",
            border: "border-red-200 dark:border-red-900",
          }}
          change={comparisons?.youtubeChange}
        />

        <StatCard
          value={stats.articles}
          title="Articles"
          icon={FileText}
          colorScheme={{
            icon: "text-green-500 dark:text-green-200",
            background: "bg-green-100 dark:bg-green-800",
            border: "border-green-200 dark:border-green-900",
          }}
          change={comparisons?.articlesChange}
        />
      </div>
    </div>
  );
}
