'use client';

import { useState, useEffect } from 'react';
import { apiService } from '@/lib/api';
import { Allocation } from '@/types/api';
import AllocationSlider from '@/components/AllocationSlider';
import AppLayout from '@/components/AppLayout';

export default function Home() {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchAllocations();
  }, []);

  const fetchAllocations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getAllocations();
      setAllocations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load allocations');
      console.error('Error fetching allocations:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAllocations = async (
    updatedAllocations: { charity_id: number; percentage: number }[]
  ) => {
    try {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);
      
      const data = await apiService.updateAllocations({
        allocations: updatedAllocations,
      });
      
      setAllocations(data);
      setSuccessMessage('✅ Allocations saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update allocations');
      console.error('Error updating allocations:', err);
    } finally {
      setSaving(false);
    }
  };

  const totalMonthlyBudget = 100; // Mocked $100/month budget

  return (
    <AppLayout>
      <div className="p-8 bg-gray-50 min-h-full">
        {/* Page Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Allocation Dashboard</h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your monthly donations to high-impact charities
          </p>
        </div>

        {/* Budget Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-700">Monthly Budget</h2>
              <p className="text-xs text-gray-500">Committed to effective giving</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-green-600">${totalMonthlyBudget}</p>
              <p className="text-xs text-gray-500">per month</p>
            </div>
          </div>
        </div>

        {/* Allocations Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-1">
            Your Allocations
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Adjust the sliders to change how your donation is distributed
          </p>

          {/* Success Message */}
          {successMessage && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
              {successMessage}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
              <button
                onClick={fetchAllocations}
                className="mt-2 text-sm text-red-700 underline hover:text-red-800"
              >
                Try again
              </button>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          )}

          {/* Allocations */}
          {!loading && !error && allocations.length > 0 && (
            <>
              <AllocationSlider
                allocations={allocations}
                onUpdate={handleUpdateAllocations}
              />
              
              {saving && (
                <div className="mt-4 text-center text-gray-600">
                  Saving changes...
                </div>
              )}
            </>
          )}

          {/* Empty State */}
          {!loading && !error && allocations.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">
                No allocations found. Make sure the backend is running and seeded.
              </p>
            </div>
          )}
        </div>

        {/* Charity Details */}
        {!loading && allocations.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              About These Charities
            </h2>
            <div className="space-y-4">
              {allocations.map((alloc) => (
                <div key={alloc.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <h3 className="font-semibold text-gray-900">{alloc.charity.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{alloc.charity.description}</p>
                  <a
                    href={alloc.charity.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-800 underline mt-1 inline-block"
                  >
                    Learn more →
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
