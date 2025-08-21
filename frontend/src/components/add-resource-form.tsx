import { Link as LinkIcon, Plus } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CreateResourceRequest } from "@/types/resource";

interface AddResourceFormProps {
  onSubmit: (data: CreateResourceRequest) => void;
  isLoading?: boolean;
}

export function AddResourceForm({
  onSubmit,
  isLoading = false,
}: AddResourceFormProps) {
  const [url, setUrl] = useState("");
  const [language, setLanguage] = useState<"original" | "italian" | "english">(
    "original"
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    onSubmit({
      link: url.trim(),
      language,
    });

    // Reset form
    setUrl("");
    setLanguage("english");
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const canSubmit = url.trim() && isValidUrl(url) && !isLoading;

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2 text-lg">
          <Plus className="h-4 w-4" />
          <span>Add New Resource</span>
        </CardTitle>
        <CardDescription className="text-sm">
          Paste a YouTube video or article link to add it to your collection
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <form
          onSubmit={handleSubmit}
          className="flex flex-col md:flex-row gap-3"
        >
          <div className="flex-1">
            <div className="relative">
              <LinkIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Resource Link"
                className="pl-10 bg-background focus:bg-background placeholder:text-card-foreground/70"
                disabled={isLoading}
              />
            </div>
            {url && !isValidUrl(url) && (
              <p className="text-xs text-destructive mt-1">
                Please enter a valid URL
              </p>
            )}
          </div>

          <div className="flex gap-2 md:w-auto w-full ">
            <Select
              value={language}
              onValueChange={(value) => setLanguage(value as any)}
            >
              <SelectTrigger className="w-32 bg-background focus:bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="original">Original</SelectItem>
                <SelectItem value="italian">Italian</SelectItem>
                <SelectItem value="english">English</SelectItem>
              </SelectContent>
            </Select>

            <Button
              type="submit"
              disabled={!canSubmit}
              className="whitespace-nowrap"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                  Processing...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Resource
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
