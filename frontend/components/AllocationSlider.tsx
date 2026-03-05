'use client';

import { useState, useEffect } from 'react';
import { Allocation } from '@/types/api';

interface AllocationSliderProps {
  allocations: Allocation[];
  onUpdate: (updatedAllocations: { charity_id: number; percentage: number }[]) => void;
  displayMode: 'percentage' | 'monetary';
  monthlyBudget: number;
}

export default function AllocationSlider({ allocations, onUpdate, displayMode, monthlyBudget }: AllocationSliderProps) {
  const [localAllocations, setLocalAllocations] = useState<
    { id: number; charity_id: number; charityName: string; percentage: number; locked: boolean }[]
  >([]);

  useEffect(() => {
    // Initialize local state from props
    const mapped = allocations.map((alloc) => ({
      id: alloc.id,
      charity_id: alloc.charity_id,
      charityName: alloc.charity.name,
      percentage: alloc.percentage * 100, // Convert to percentage (0-100)
      locked: false, // Start with all unlocked
    }));
    setLocalAllocations(mapped);
  }, [allocations]);

  const toggleLock = (charityId: number) => {
    setLocalAllocations((prev) =>
      prev.map((alloc) =>
        alloc.charity_id === charityId ? { ...alloc, locked: !alloc.locked } : alloc
      )
    );
  };

  /**
   * ⭐ THE SMART BALANCING LOGIC ⭐
   * Ensures total allocation always equals 100%
   * Respects locked charities - only adjusts unlocked ones
   */
  const handleSliderChange = (charityId: number, newValue: number) => {
    const currentIndex = localAllocations.findIndex((a) => a.charity_id === charityId);
    if (currentIndex === -1) return;

    const currentValue = localAllocations[currentIndex].percentage;
    
    // Get locked and unlocked allocations (excluding current)
    const lockedAllocations = localAllocations.filter((a) => a.locked && a.charity_id !== charityId);
    const unlockedAllocations = localAllocations.filter((a) => !a.locked && a.charity_id !== charityId);
    
    const lockedTotal = lockedAllocations.reduce((sum, a) => sum + a.percentage, 0);
    const unlockedTotal = unlockedAllocations.reduce((sum, a) => sum + a.percentage, 0);
    
    // Calculate available space for this charity
    const maxValue = 100 - lockedTotal;
    newValue = Math.min(newValue, maxValue);
    newValue = Math.max(newValue, 0);

    // Create new allocations array
    const updatedAllocations = [...localAllocations];
    updatedAllocations[currentIndex] = {
      ...updatedAllocations[currentIndex],
      percentage: newValue,
    };

    // Calculate remaining percentage to distribute among unlocked charities
    const remainingForUnlocked = 100 - newValue - lockedTotal;

    // Distribute the remaining percentage proportionally among unlocked charities only
    if (unlockedAllocations.length > 0) {
      if (unlockedTotal > 0) {
        // Distribute proportionally based on current values
        unlockedAllocations.forEach((alloc) => {
          const index = updatedAllocations.findIndex((a) => a.charity_id === alloc.charity_id);
          const proportion = alloc.percentage / unlockedTotal;
          updatedAllocations[index] = {
            ...updatedAllocations[index],
            percentage: remainingForUnlocked * proportion,
          };
        });
      } else {
        // Distribute equally if all unlocked are at 0
        const equalShare = remainingForUnlocked / unlockedAllocations.length;
        unlockedAllocations.forEach((alloc) => {
          const index = updatedAllocations.findIndex((a) => a.charity_id === alloc.charity_id);
          updatedAllocations[index] = {
            ...updatedAllocations[index],
            percentage: equalShare,
          };
        });
      }
    }

    setLocalAllocations(updatedAllocations);
  };

  const handleSave = () => {
    // Convert back to 0.0-1.0 format for API
    const payload = localAllocations.map((alloc) => ({
      charity_id: alloc.charity_id,
      percentage: alloc.percentage / 100,
    }));
    onUpdate(payload);
  };

  const totalPercentage = localAllocations.reduce((sum, a) => sum + a.percentage, 0);

  // Helper function to format display value
  const formatDisplayValue = (percentage: number) => {
    if (displayMode === 'percentage') {
      return `${percentage.toFixed(1)}%`;
    } else {
      const amount = (percentage / 100) * monthlyBudget;
      return `HKD ${amount.toLocaleString('en-HK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  };

  const formatTotalDisplay = () => {
    if (displayMode === 'percentage') {
      return `${totalPercentage.toFixed(1)}%`;
    } else {
      const totalAmount = (totalPercentage / 100) * monthlyBudget;
      return `HKD ${totalAmount.toLocaleString('en-HK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Allocation Sliders */}
      <div className="space-y-4">
        {localAllocations.map((alloc) => (
          <div key={alloc.charity_id} className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor={`slider-${alloc.charity_id}`} className="font-medium text-gray-700">
                {alloc.charityName}
              </label>
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold" style={{ color: '#fabe36' }}>
                  {formatDisplayValue(alloc.percentage)}
                </span>
                <button
                  onClick={() => toggleLock(alloc.charity_id)}
                  className="p-1.5 rounded-md hover:bg-gray-100 transition-colors"
                  title={alloc.locked ? 'Unlock allocation' : 'Lock allocation'}
                  type="button"
                >
                  <span className="text-xl" style={{ color: alloc.locked ? '#fabe36' : '#9ca3af' }}>
                    {alloc.locked ? '🔒' : '🔓'}
                  </span>
                </button>
              </div>
            </div>
            <div className="relative">
              <input
                id={`slider-${alloc.charity_id}`}
                type="range"
                min="0"
                max="100"
                step="0.1"
                value={alloc.percentage}
                onChange={(e) => handleSliderChange(alloc.charity_id, parseFloat(e.target.value))}
                disabled={alloc.locked}
                className="w-full h-3 rounded-lg appearance-none cursor-pointer transition-opacity"
                style={{
                  background: `linear-gradient(to right, ${alloc.locked ? '#fef3e2' : '#fabe36'} 0%, ${alloc.locked ? '#fef3e2' : '#fabe36'} ${alloc.percentage}%, #e5e7eb ${alloc.percentage}%, #e5e7eb 100%)`,
                  cursor: alloc.locked ? 'not-allowed' : 'pointer',
                  opacity: alloc.locked ? 0.6 : 1,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Total & Save Button */}
      <div className="pt-6 border-t border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <span className="text-xl font-semibold">Total Allocated:</span>
          <span
            className={`text-2xl font-bold ${
              Math.abs(totalPercentage - 100) < 0.1 ? 'text-green-600' : 'text-red-600'
            }`}
          >
            {formatTotalDisplay()}
          </span>
        </div>

        <button
          onClick={handleSave}
          disabled={Math.abs(totalPercentage - 100) > 0.1}
          className="w-full py-3 px-6 text-white font-semibold rounded-lg 
                   disabled:bg-gray-300 disabled:cursor-not-allowed
                   transition-all duration-200"
          style={Math.abs(totalPercentage - 100) <= 0.1 ? { backgroundColor: '#fabe36' } : {}}
          onMouseEnter={(e) => {
            if (Math.abs(totalPercentage - 100) <= 0.1) {
              e.currentTarget.style.backgroundColor = '#f5a623';
            }
          }}
          onMouseLeave={(e) => {
            if (Math.abs(totalPercentage - 100) <= 0.1) {
              e.currentTarget.style.backgroundColor = '#fabe36';
            }
          }}
        >
          Save Allocations
        </button>

        {Math.abs(totalPercentage - 100) > 0.1 && (
          <p className="mt-2 text-sm text-red-600 text-center">
            {displayMode === 'percentage' 
              ? 'Total must equal 100% to save'
              : `Total must equal HKD ${monthlyBudget.toLocaleString('en-HK', { minimumFractionDigits: 2 })} to save`
            }
          </p>
        )}
      </div>
    </div>
  );
}
