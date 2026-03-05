// API service for communicating with FastAPI backend

import { Charity, Allocation, AllocationUpdatePayload } from '@/types/api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Unknown error' }));
      throw new Error(error.detail || `HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  // ==================== CHARITY ENDPOINTS ====================

  async getCharities(): Promise<Charity[]> {
    const response = await fetch(`${this.baseUrl}/charities`);
    return this.handleResponse<Charity[]>(response);
  }

  async getCharity(id: number): Promise<Charity> {
    const response = await fetch(`${this.baseUrl}/charities/${id}`);
    return this.handleResponse<Charity>(response);
  }

  // ==================== ALLOCATION ENDPOINTS ====================

  async getAllocations(userId: number = 1): Promise<Allocation[]> {
    const response = await fetch(`${this.baseUrl}/allocations?user_id=${userId}`);
    return this.handleResponse<Allocation[]>(response);
  }

  async updateAllocations(
    payload: AllocationUpdatePayload,
    userId: number = 1
  ): Promise<Allocation[]> {
    const response = await fetch(`${this.baseUrl}/allocations?user_id=${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    return this.handleResponse<Allocation[]>(response);
  }

  // ==================== HEALTH CHECK ====================

  async healthCheck(): Promise<{ status: string; service: string }> {
    const response = await fetch(`${this.baseUrl}/`);
    return this.handleResponse(response);
  }
}

// Export singleton instance
export const apiService = new ApiService();
