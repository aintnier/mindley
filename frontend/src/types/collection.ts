export interface Collection {
  id: string;
  name: string;
  description?: string;
  color?: string; // Hex color for visual identification
  created_date: string;
  updated_date: string;
  user_id: string;
  resource_count: number;
  is_public: boolean;
  tags?: string[];
}

export interface CollectionResource {
  collection_id: string;
  resource_id: string;
  added_date: string;
  position?: number; // For custom ordering within collection
}

export interface CreateCollectionRequest {
  name: string;
  description?: string;
  color?: string;
  user_id: string;
  is_public?: boolean;
  tags?: string[];
}

export interface UpdateCollectionRequest {
  name?: string;
  description?: string;
  color?: string;
  is_public?: boolean;
  tags?: string[];
}

export interface CollectionWithResources extends Collection {
  resources: Array<{
    id: string;
    title: string;
    content_type: string;
    processed_date: string;
    added_to_collection_date: string;
    thumbnail_link?: string | null;
    author?: string;
    link?: string;
    published_date?: string;
    summary?: string;
    tags?: string[];
  }>;
}
