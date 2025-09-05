import { Filter, Search, Tag } from "lucide-react";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface FilterOptions {
  search: string;
  contentType: "all" | "youtube" | "article";
  sortBy: "date" | "title" | "author";
  sortOrder: "asc" | "desc";
  selectedTags: string[];
}

interface ResourceFiltersProps {
  filters: FilterOptions;
  onFiltersChange: (filters: FilterOptions) => void;
  availableTags: string[];
}

export function ResourceFilters({
  filters,
  onFiltersChange,
  availableTags,
}: ResourceFiltersProps) {
  const [searchInput, setSearchInput] = useState(filters.search);

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    // Debounce search
    setTimeout(() => {
      onFiltersChange({ ...filters, search: value });
    }, 300);
  };

  const toggleTag = (tag: string) => {
    const newTags = filters.selectedTags.includes(tag)
      ? filters.selectedTags.filter((t) => t !== tag)
      : [...filters.selectedTags, tag];

    onFiltersChange({ ...filters, selectedTags: newTags });
  };

  const clearFilters = () => {
    setSearchInput("");
    onFiltersChange({
      search: "",
      contentType: "all",
      sortBy: "date",
      sortOrder: "desc",
      selectedTags: [],
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Filter className="h-5 w-5" />
          <span>Filters & Search</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search by title, author or content..."
            className="pl-10"
          />
        </div>

        {/* Content Type and Sort */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="text-sm font-medium mb-2 block">Type</label>
            <Select
              value={filters.contentType}
              onValueChange={(value: FilterOptions["contentType"]) =>
                onFiltersChange({ ...filters, contentType: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="youtube">YouTube</SelectItem>
                <SelectItem value="article">Articles</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Sort by</label>
            <Select
              value={filters.sortBy}
              onValueChange={(value: FilterOptions["sortBy"]) =>
                onFiltersChange({ ...filters, sortBy: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Data</SelectItem>
                <SelectItem value="title">Titolo</SelectItem>
                <SelectItem value="author">Autore</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Order</label>
            <Select
              value={filters.sortOrder}
              onValueChange={(value: FilterOptions["sortOrder"]) =>
                onFiltersChange({ ...filters, sortOrder: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Descending</SelectItem>
                <SelectItem value="asc">Ascending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="text-sm font-medium mb-2 flex items-center space-x-1">
            <Tag className="h-4 w-4" />
            <span>Tags</span>
          </label>
          <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
            {availableTags.map((tag) => (
              <Badge
                key={tag}
                variant={
                  filters.selectedTags.includes(tag) ? "default" : "outline"
                }
                className="cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => toggleTag(tag)}
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div>

        {/* Clear Filters */}
        {(filters.search ||
          filters.contentType !== "all" ||
          filters.selectedTags.length > 0) && (
          <Button variant="outline" onClick={clearFilters} className="w-full">
            Clear Filters
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
