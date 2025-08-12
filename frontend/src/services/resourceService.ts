import { mockResources } from "@/data/mockResources";
import type { Resource } from "@/types/resource";

// Mock API service that will be replaced with real API calls
export const resourceService = {
  // Get all resources
  async getAllResources(): Promise<Resource[]> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 100));
    return mockResources;
  },

  // Get resource by ID
  async getResourceById(id: string): Promise<Resource | null> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 200));
    return mockResources.find((resource) => resource.id === id) || null;
  },

  // Create new resource (placeholder for future implementation)
  async createResource(_data: any): Promise<Resource> {
    // This will be implemented when backend is ready
    throw new Error("Backend not yet implemented");
  },

  // Update resource (placeholder for future implementation)
  async updateResource(_id: string, _data: any): Promise<Resource> {
    // This will be implemented when backend is ready
    throw new Error("Backend not yet implemented");
  },

  // Delete resource (placeholder for future implementation)
  async deleteResource(_id: string): Promise<void> {
    // This will be implemented when backend is ready
    throw new Error("Backend not yet implemented");
  },
};
