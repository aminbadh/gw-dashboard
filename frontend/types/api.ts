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

export interface AllocationHistoryItem {
  charity_id: number;
  percentage: number;
  charity: Charity;
}

export interface AllocationHistorySnapshot {
  saved_at: string;
  allocations: AllocationHistoryItem[];
}
