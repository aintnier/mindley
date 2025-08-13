import { createClient } from "@supabase/supabase-js";
import type { Resource } from "@/types/resource";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const CREATE_RESOURCE_URL = `${supabaseUrl}/functions/v1/create-resource`;
const READ_RESOURCE_URL = `${supabaseUrl}/functions/v1/read-resource`;
const UPDATE_RESOURCE_URL = `${supabaseUrl}/functions/v1/update-resource`;
const DELETE_RESOURCE_URL = `${supabaseUrl}/functions/v1/delete-resource`;

async function getAccessToken() {
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token;
}

interface RawResourceData {
  id?: string;
  title?: string;
  author?: string;
  link?: string;
  source_url?: string;
  published_date?: string;
  content_type?: string;
  summary?: string;
  tags?: string[];
  thumbnail_link?: string;
  processed_date?: string;
  processed_at?: string;
  user_id?: string;
  [key: string]: unknown;
}

function mapResourceFields(resource: RawResourceData): Resource {
  return {
    id: resource.id as string,
    title: resource.title as string,
    author: resource.author || null,
    link: (resource.link ?? resource.source_url ?? "") as string,
    published_date: resource.published_date || null,
    content_type: resource.content_type as "youtube" | "article",
    summary: resource.summary as string,
    tags: resource.tags as string[],
    thumbnail_link: resource.thumbnail_link || null,
    processed_date: (resource.processed_date ?? resource.processed_at ??
      new Date().toISOString()) as string,
    user_id: resource.user_id as string,
  };
}

export const resourceService = {
  async getAllResources(): Promise<Resource[]> {
    const token = await getAccessToken();
    const res = await fetch(READ_RESOURCE_URL, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Errore caricamento risorse");
    const data = await res.json();
    return Array.isArray(data) ? data.map(mapResourceFields) : [];
  },

  async getResourceById(id: string): Promise<Resource | null> {
    const token = await getAccessToken();
    const res = await fetch(
      `${READ_RESOURCE_URL}?id=${encodeURIComponent(id)}`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (!res.ok) return null;
    const data = await res.json();
    return data ? mapResourceFields(data) : null;
  },

  async createResource(data: Partial<Resource>): Promise<Resource> {
    const token = await getAccessToken();
    const res = await fetch(CREATE_RESOURCE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Errore creazione risorsa");
    // The create-resource function responds with 202, does not return the resource immediately
    return {
      ...data,
      id: "pending",
      processed_date: new Date().toISOString(),
    } as Resource;
  },

  async updateResource(id: string, data: Partial<Resource>): Promise<Resource> {
    const token = await getAccessToken();
    const res = await fetch(
      `${UPDATE_RESOURCE_URL}?id=${encodeURIComponent(id)}`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      },
    );
    if (!res.ok) throw new Error("Errore aggiornamento risorsa");
    const updated = await res.json();
    return mapResourceFields(updated);
  },

  async deleteResource(id: string): Promise<void> {
    const token = await getAccessToken();
    const res = await fetch(
      `${DELETE_RESOURCE_URL}?id=${encodeURIComponent(id)}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    if (!res.ok) throw new Error("Errore eliminazione risorsa");
  },
};
