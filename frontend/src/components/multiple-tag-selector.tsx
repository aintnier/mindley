// Funzione per assegnare colore coerente ai tag (come nelle card)
const getTagColor = (tag: string) => {
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
import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface MultipleTagSelectorProps {
  availableTags: string[];
  tagCounts: Record<string, number>;
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
  placeholder?: string;
}

export function MultipleTagSelector({
  availableTags,
  tagCounts,
  selectedTags,
  onTagsChange,
  placeholder = "Select tags...",
}: MultipleTagSelectorProps) {
  const [open, setOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const handleTagToggle = (tag: string) => {
    const isSelected = selectedTags.includes(tag);
    if (isSelected) {
      onTagsChange(selectedTags.filter((t) => t !== tag));
    } else {
      onTagsChange([...selectedTags, tag]);
    }
  };

  const handleTagRemove = (tagToRemove: string) => {
    onTagsChange(selectedTags.filter((tag) => tag !== tagToRemove));
  };

  const clearAllTags = () => {
    onTagsChange([]);
  };

  // Filter tags based on search value
  const filteredTags = availableTags.filter((tag) =>
    tag.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <div className="relative">
      <Popover
        open={open}
        onOpenChange={(newOpen: boolean) => {
          setOpen(newOpen);
          if (!newOpen) {
            setSearchValue("");
          }
        }}
      >
        <PopoverTrigger asChild>
          <Button
            variant="select"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between h-10 px-3 py-2"
          >
            <div className="flex items-center gap-1 flex-1 overflow-hidden">
              {selectedTags.length === 0
                ? (
                  <span className="text-muted-foreground text-sm">
                    {placeholder}
                  </span>
                )
                : selectedTags.length > 3
                ? (
                  <>
                    <Badge
                      variant="tag"
                      className={`text-xs px-2 py-0.5 cursor-pointer shrink-0 ${
                        getTagColor(
                          selectedTags[0],
                        )
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTagRemove(selectedTags[0]);
                      }}
                    >
                      {selectedTags[0]}
                      <X className="ml-1 h-3 w-3" />
                    </Badge>
                    <Badge
                      variant="tag"
                      className={`text-xs cursor-pointer shrink-0 ${
                        getTagColor(
                          selectedTags[1],
                        )
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTagRemove(selectedTags[1]);
                      }}
                    >
                      {selectedTags[1]}
                      <X className="ml-1 h-3 w-3" />
                    </Badge>
                    <Badge variant="outline" className="text-xs shrink-0">
                      +{selectedTags.length - 2} more
                    </Badge>
                  </>
                )
                : (
                  selectedTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="tag"
                      className={`text-xs cursor-pointer shrink-0 ${
                        getTagColor(
                          tag,
                        )
                      }`}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTagRemove(tag);
                      }}
                    >
                      {tag}
                      <X className="ml-1 h-3 w-3" />
                    </Badge>
                  ))
                )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <Command>
            <CommandInput
              placeholder="Search tags..."
              value={searchValue}
              onValueChange={setSearchValue}
            />
            <CommandList>
              <CommandEmpty>No tags found.</CommandEmpty>
              <CommandGroup>
                {filteredTags.map((tag) => (
                  <CommandItem
                    key={tag}
                    value={tag}
                    onSelect={() => handleTagToggle(tag)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        selectedTags.includes(tag)
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    {tag}
                    <Badge variant="tagCount" className="ml-auto text-xs">
                      {tagCounts[tag] || 0}
                    </Badge>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      {selectedTags.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-1 flex items-center justify-between text-xs text-muted-foreground">
          <span>{selectedTags.length} tags selected</span>
          <button
            onClick={clearAllTags}
            className="text-primary hover:underline"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
