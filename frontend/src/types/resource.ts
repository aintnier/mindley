export interface Resource {
  id: string;
  title: string;
  author: string | null;
  link: string;
  published_date: string | null;
  content_type: "youtube" | "article";
  summary: string;
  tags: string[];
  key_points: string[];
  thumbnail_link: string | null;
  processed_date: string;
  user_id: string;
}

export interface CreateResourceRequest {
  link: string;
  language?: "original" | "italian" | "english";
}
