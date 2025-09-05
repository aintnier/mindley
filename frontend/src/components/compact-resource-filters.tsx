import { Search } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MultipleTagSelector } from "@/components/multiple-tag-selector";
import { cn } from "@/lib/utils";

export interface FilterOptions {
  search: string;
  contentType: "all" | "youtube" | "article";
  sortBy: "date" | "title" | "author";
  sortOrder: "asc" | "desc";
  selectedTags: string[];
}

interface CompactResourceFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  availableTags: string[];
  tagCounts: Record<string, number>;
  resultCount: number;
}

export function CompactResourceFilters({
  filters,
  onFiltersChange,
  availableTags,
  tagCounts,
  resultCount,
}: CompactResourceFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search);
  const hasTagInfo = filters.selectedTags.length > 0;

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    // Debounce search
    setTimeout(() => {
      onFiltersChange({ ...filters, search: value });
    }, 300);
  };

  return (
    <div
      className={cn(
        "space-y-4",
        "mb-4",
        hasTagInfo && "md:mb-8",
        !hasTagInfo && "md:mb-6"
      )}
    >
      {/* Results header with controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4  ">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Your Resources</h2>
          <p className="text-muted-foreground">
            {resultCount}{" "}
            {resultCount === 1 ? "resource found" : "resources found"}
          </p>
        </div>

        {/* Compact filter controls */}
        <div
          className={cn(
            "flex flex-wrap items-center gap-2",
            hasTagInfo && "pb-4 md:pb-2"
          )}
        >
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder="Search resources..."
              className="pl-10 w-64"
            />
          </div>

          {/* Content Type */}
          <Select
            value={filters.contentType}
            onValueChange={(value: FilterOptions["contentType"]) =>
              onFiltersChange({ ...filters, contentType: value })
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="article">Articles</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onValueChange={(value: string) => {
              const [sortBy, sortOrder] = value.split("-");
              onFiltersChange({
                ...filters,
                sortBy: sortBy as FilterOptions["sortBy"],
                sortOrder: sortOrder as FilterOptions["sortOrder"],
              });
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">Newest First</SelectItem>
              <SelectItem value="date-asc">Oldest First</SelectItem>
              <SelectItem value="title-asc">Title A-Z</SelectItem>
              <SelectItem value="title-desc">Title Z-A</SelectItem>
              <SelectItem value="author-asc">Author A-Z</SelectItem>
              <SelectItem value="author-desc">Author Z-A</SelectItem>
            </SelectContent>
          </Select>

          {/* Tag Selector */}
          <div className="w-80 min-w-[18rem]">
            <MultipleTagSelector
              availableTags={availableTags}
              tagCounts={tagCounts}
              selectedTags={filters.selectedTags}
              onTagsChange={(tags) =>
                onFiltersChange({ ...filters, selectedTags: tags })
              }
              placeholder="Filter by tags..."
            />
          </div>
        </div>
      </div>
    </div>
  );
}
