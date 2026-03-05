// TypeScript types matching the backend schemas

export interface Charity {
  id: number;
  name: string;
  description: string;
  website_url: string;
}

export interface Allocation {
  id: number;
  charity_id: number;
  user_id: number;
  percentage: number; // 0.0 to 1.0
  charity: Charity;
}

export interface AllocationUpdate {
  charity_id: number;
  percentage: number;
}

export interface AllocationUpdatePayload {
  allocations: AllocationUpdate[];
}
