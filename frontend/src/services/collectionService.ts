import { supabase } from "@/lib/supabase";
import type { 
  Collection, 
  CreateCollectionRequest, 
  UpdateCollectionRequest,
  CollectionWithResources 
} from "@/types/collection";
import { resourceService } from "./resourceService";

class CollectionService {
  private async getAuthHeaders() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      throw new Error("Not authenticated");
    }
    
    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    };
  }

  // Get all collections for current user
  async getAllCollections(): Promise<Collection[]> {
    try {
      const headers = await this.getAuthHeaders();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      
      const response = await fetch(`${supabaseUrl}/functions/v1/read-collection`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch collections: ${response.statusText}`);
      }

      const collections = await response.json();
      return collections;
    } catch (error) {
      console.error("Error loading collections:", error);
      return [];
    }
  }

  // Get single collection by ID
  async getCollection(id: string): Promise<Collection | null> {
    try {
      const headers = await this.getAuthHeaders();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      
      const response = await fetch(`${supabaseUrl}/functions/v1/read-collection?id=${id}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new Error(`Failed to fetch collection: ${response.statusText}`);
      }

      const collection = await response.json();
      return collection;
    } catch (error) {
      console.error("Error loading collection:", error);
      return null;
    }
  }

  // Get collection with its resources
  async getCollectionWithResources(collectionId: string): Promise<CollectionWithResources | null> {
    try {
      // Get the collection details first
      const collection = await this.getCollection(collectionId);
      if (!collection) {
        return null;
      }

      // Get all resources and filter by collection
      const allResources = await resourceService.getAllResources();
      
      // Get collection-resource relationships from database
      const { data: collectionResources, error } = await supabase
        .from('collection_resources')
        .select('resource_id, added_date')
        .eq('collection_id', collectionId);

      if (error) {
        console.error('Error fetching collection resources:', error);
        return {
          ...collection,
          resources: []
        };
      }

      // Filter resources that belong to this collection
      const resourcesInCollection = allResources
        .filter(resource => 
          collectionResources?.some(cr => cr.resource_id === resource.id)
        )
        .map(resource => {
          const collectionResource = collectionResources.find(cr => cr.resource_id === resource.id);
          return {
            id: resource.id,
            title: resource.title,
            content_type: resource.content_type,
            processed_date: resource.processed_date,
            added_to_collection_date: collectionResource?.added_date || resource.processed_date,
            thumbnail_link: resource.thumbnail_link,
            author: resource.author || undefined,
            link: resource.link,
            published_date: resource.published_date || undefined,
            summary: resource.summary,
            tags: resource.tags
          };
        });

      return {
        ...collection,
        resources: resourcesInCollection
      };
    } catch (error) {
      console.error("Error loading collection with resources:", error);
      return null;
    }
  }

  // Create new collection
  async createCollection(data: CreateCollectionRequest): Promise<Collection> {
    try {
      const headers = await this.getAuthHeaders();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      
      const response = await fetch(`${supabaseUrl}/functions/v1/create-collection`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create collection');
      }

      const newCollection = await response.json();
      return newCollection;
    } catch (error) {
      console.error("Error creating collection:", error);
      throw error;
    }
  }

  // Update collection
  async updateCollection(id: string, data: UpdateCollectionRequest): Promise<Collection> {
    try {
      const headers = await this.getAuthHeaders();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      
      const response = await fetch(`${supabaseUrl}/functions/v1/update-collection`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({ id, ...data }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update collection');
      }

      const updatedCollection = await response.json();
      return updatedCollection;
    } catch (error) {
      console.error("Error updating collection:", error);
      throw error;
    }
  }

  // Delete collection
  async deleteCollection(id: string): Promise<void> {
    try {
      const headers = await this.getAuthHeaders();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      
      const response = await fetch(`${supabaseUrl}/functions/v1/delete-collection?id=${id}`, {
        method: 'DELETE',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete collection');
      }
    } catch (error) {
      console.error("Error deleting collection:", error);
      throw error;
    }
  }

  // Add resource to collection
  async addResourceToCollection(collectionId: string, resourceId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('collection_resources')
        .insert({
          collection_id: collectionId,
          resource_id: resourceId,
          added_date: new Date().toISOString()
        });

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Error adding resource to collection:", error);
      throw error;
    }
  }

  // Remove resource from collection
  async removeResourceFromCollection(collectionId: string, resourceId: string): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from('collection_resources')
        .delete()
        .eq('collection_id', collectionId)
        .eq('resource_id', resourceId);

      if (error) {
        throw error;
      }
    } catch (error) {
      console.error("Error removing resource from collection:", error);
      throw error;
    }
  }

  // Get collections that contain a specific resource
  async getCollectionsForResource(resourceId: string): Promise<Collection[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Get collection IDs that contain this resource
      const { data: collectionResources, error: crError } = await supabase
        .from('collection_resources')
        .select('collection_id')
        .eq('resource_id', resourceId);

      if (crError) {
        throw crError;
      }

      if (!collectionResources || collectionResources.length === 0) {
        return [];
      }

      // Get all collections for user
      const allCollections = await this.getAllCollections();
      
      // Filter collections that contain this resource
      const collectionIds = collectionResources.map(cr => cr.collection_id);
      const collectionsWithResource = allCollections.filter(collection => 
        collectionIds.includes(collection.id)
      );

      return collectionsWithResource;
    } catch (error) {
      console.error("Error loading collections for resource:", error);
      return [];
    }
  }
}

export const collectionService = new CollectionService();
