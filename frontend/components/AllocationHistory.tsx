'use client';

import { useState, useEffect } from 'react';
import { apiService } from '@/lib/api';
import { AllocationHistorySnapshot } from '@/types/api';

interface AllocationHistoryProps {
  onRestore: (allocations: { charity_id: number; percentage: number }[]) => void; // Callback to load values into sliders
  refreshTrigger?: number; // Trigger to refresh history when allocations are saved
}

export default function AllocationHistory({ onRestore, refreshTrigger }: AllocationHistoryProps) {
  const [history, setHistory] = useState<AllocationHistorySnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0) {
      fetchHistory();
    }
  }, [refreshTrigger]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getAllocationHistory();
      setHistory(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load history');
      console.error('Error fetching history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = (snapshot: AllocationHistorySnapshot) => {
    // Convert snapshot to the format expected by AllocationSlider
    const allocations = snapshot.allocations.map((alloc) => ({
      charity_id: alloc.charity_id,
      percentage: alloc.percentage,
    }));
    onRestore(allocations);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderBottomColor: '#fabe36' }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800 font-medium">Error</p>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">No allocation history yet.</p>
        <p className="text-xs mt-1">Save your allocations to start tracking history.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {history.map((snapshot, index) => (
        <div
          key={snapshot.saved_at}
          className="border border-gray-200 rounded-lg p-3 hover:border-gray-300 transition-colors bg-white"
        >
          <div className="flex justify-between items-start mb-2">
            <div>
              <p className="text-sm font-semibold text-gray-700">
                {index === 0 ? '🕐 Most Recent' : '📅 Previous Save'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {formatDate(snapshot.saved_at)}
              </p>
            </div>
            <button
              onClick={() => handleRestore(snapshot)}
              className="px-3 py-1.5 text-xs font-medium rounded-md transition-colors border shrink-0"
              style={{
                borderColor: '#fabe36',
                color: '#fabe36',
                backgroundColor: 'transparent',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#fef3e2';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              Load
            </button>
          </div>

          <div className="space-y-1.5">
            {snapshot.allocations.map((alloc) => (
              <div key={alloc.charity_id} className="flex justify-between items-center text-sm">
                <span className="text-gray-700">{alloc.charity.name}</span>
                <span className="font-medium" style={{ color: '#fabe36' }}>
                  {(alloc.percentage * 100).toFixed(1)}%
                </span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
