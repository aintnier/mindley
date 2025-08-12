export interface Resource {
  id: string;
  title: string;
  author: string;
  source_url: string;
  published_date: string;
  content_type: "youtube" | "article";
  summary: string;
  tags: string[];
  processed_at: string;
}

export interface CreateResourceRequest {
  url: string;
  language?: "original" | "italian" | "english";
}
