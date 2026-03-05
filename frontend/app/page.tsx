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
  const [displayMode, setDisplayMode] = useState<'percentage' | 'monetary'>('percentage');

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

  const totalMonthlyBudget = 1000; // HKD 1000/month budget

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
              <p className="text-3xl font-bold text-green-600">HKD {totalMonthlyBudget.toLocaleString()}</p>
              <p className="text-xs text-gray-500">per month</p>
            </div>
          </div>
        </div>

        {/* Allocations Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Your Allocations
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Adjust the sliders to change how your donation is distributed
              </p>
            </div>
            
            {/* Display Mode Toggle */}
            <div className="flex items-center space-x-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setDisplayMode('percentage')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  displayMode === 'percentage'
                    ? 'text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                style={displayMode === 'percentage' ? { backgroundColor: '#fabe36' } : {}}
              >
                %
              </button>
              <button
                onClick={() => setDisplayMode('monetary')}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                  displayMode === 'monetary'
                    ? 'text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
                style={displayMode === 'monetary' ? { backgroundColor: '#fabe36' } : {}}
              >
                HKD
              </button>
            </div>
          </div>

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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderBottomColor: '#fabe36' }}></div>
            </div>
          )}

          {/* Allocations */}
          {!loading && !error && allocations.length > 0 && (
            <>
              <AllocationSlider
                allocations={allocations}
                onUpdate={handleUpdateAllocations}
                displayMode={displayMode}
                monthlyBudget={totalMonthlyBudget}
              />
              
              {/* Status Messages */}
              <div className="mt-4 text-center min-h-[32px]">
                {saving && (
                  <p className="text-gray-600">Saving changes...</p>
                )}
                {successMessage && !saving && (
                  <p className="text-green-600 font-medium">{successMessage}</p>
                )}
              </div>
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
                <div key={alloc.id} className="border-l-4 pl-4 py-2" style={{ borderLeftColor: '#fabe36' }}>
                  <h3 className="font-semibold text-gray-900">{alloc.charity.name}</h3>
                  <p className="text-sm text-gray-600 mt-1">{alloc.charity.description}</p>
                  <a
                    href={alloc.charity.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm underline mt-1 inline-block hover:opacity-80 transition-opacity"
                    style={{ color: '#c98d1a' }}
                  >
                    Learn more →
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-8 bg-gray-50 border border-gray-200 rounded-xl p-6">
          <div className="flex items-start space-x-3">
            <span className="text-2xl">ℹ️</span>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Demonstration Project</h3>
              <p className="text-xs text-gray-600 leading-relaxed">
                This is a proof-of-concept technical demonstration and is <strong>not affiliated with</strong> GiveWell, 
                Against Malaria Foundation, GiveDirectly, Helen Keller International, Malaria Consortium, New Incentives, 
                or any other charitable organization mentioned. Charity names and information are used for demonstration 
                purposes only. For actual donations, please visit the official websites of these organizations.
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Built as a technical portfolio project to showcase full-stack development capabilities.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
