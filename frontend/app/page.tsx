'use client';

import { useState, useEffect } from 'react';
import { apiService } from '@/lib/api';
import { Allocation } from '@/types/api';
import AllocationSlider from '@/components/AllocationSlider';
import AllocationHistory from '@/components/AllocationHistory';
import AppLayout from '@/components/AppLayout';

export default function Home() {
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [displayMode, setDisplayMode] = useState<'percentage' | 'monetary'>('percentage');
  const [selectedPreset, setSelectedPreset] = useState<string>('');
  const [historyRefreshTrigger, setHistoryRefreshTrigger] = useState(0);

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
      setSuccessMessage('Allocations saved successfully!');
      setTimeout(() => setSuccessMessage(null), 3000);
      setHistoryRefreshTrigger(prev => prev + 1); // Trigger history refresh
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update allocations');
      console.error('Error updating allocations:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleRestoreFromHistory = (restoredAllocations: { charity_id: number; percentage: number }[]) => {
    // Update current allocations with restored percentages (locally, not saved yet)
    const updated = allocations.map((alloc) => {
      const restored = restoredAllocations.find((r) => r.charity_id === alloc.charity_id);
      if (restored) {
        return {
          ...alloc,
          percentage: restored.percentage,
        };
      }
      return alloc;
    });
    
    setAllocations(updated);
    setSuccessMessage('Previous allocation loaded. Click "Save Allocations" to apply.');
    setTimeout(() => setSuccessMessage(null), 5000);
    
    // Scroll to allocations section
    setTimeout(() => {
      document.getElementById('allocations-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
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
        <div id="allocations-section" className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                Your Allocations
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Adjust the sliders to change how your donation is distributed
              </p>
            </div>
            
            {/* Preset and Display Mode Controls */}
            <div className="flex items-center gap-3">
              <div className="bg-gray-100 rounded-lg p-1">
                <select
                  value={selectedPreset}
                  onChange={(e) => setSelectedPreset(e.target.value)}
                  className="px-3 py-1.5 pr-8 text-xs font-medium rounded-md transition-colors
                           bg-transparent border-none cursor-pointer appearance-none
                           text-gray-600 hover:text-gray-900
                           focus:outline-none focus:ring-0"
                  style={{ 
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%239ca3af'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'right 0.25rem center',
                    backgroundSize: '1.25rem'
                  }}
                >
                  <option value="">Apply Preset...</option>
                  <option value="equal">📊 Equal</option>
                  <option value="focusTop2">🎯 Top 2</option>
                  <option value="focusTop3">🎯 Top 3</option>
                  <option value="gradual">📈 Gradual</option>
                  <option value="concentrated">⭐ Concentrated</option>
                </select>
              </div>
              
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
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-2 mb-2">
                <span className="text-red-600 text-lg flex-shrink-0">❌</span>
                <p className="text-red-800 font-medium">Error</p>
              </div>
              <p className="text-red-600 text-sm ml-7">{error}</p>
              <button
                onClick={fetchAllocations}
                className="mt-2 ml-7 text-sm text-red-700 underline hover:text-red-800"
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
                preset={selectedPreset}
                onPresetApplied={() => setSelectedPreset('')}
                displayMode={displayMode}
                monthlyBudget={totalMonthlyBudget}
              />
              
              {/* Status Messages */}
              <div className="mt-4 min-h-[32px]">
                {saving && (
                  <div className="flex items-center justify-center gap-2 p-3 rounded-lg border border-blue-200 bg-blue-50">
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
                    <p className="text-blue-800 text-sm font-medium">Saving changes...</p>
                  </div>
                )}
                {successMessage && !saving && (
                  <div className="flex items-center justify-center gap-2 p-3 rounded-lg border border-green-200 bg-green-50">
                    <span className="text-green-600 text-lg flex-shrink-0">✅</span>
                    <p className="text-green-800 text-sm font-medium">{successMessage}</p>
                  </div>
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

        {/* Allocation History */}
        {!loading && allocations.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              📊 Allocation History
            </h2>
            <p className="text-sm text-gray-600 mb-4">
              Review and restore previous allocation settings.
            </p>
            <AllocationHistory onRestore={handleRestoreFromHistory} refreshTrigger={historyRefreshTrigger} />
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
                {' '}
                <a
                  href="https://github.com/aminbadh/gw-dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:opacity-80 transition-opacity"
                  style={{ color: '#c98d1a' }}
                >
                  View source code on GitHub →
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
