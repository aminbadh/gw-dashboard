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
    { id: number; charity_id: number; charityName: string; percentage: number }[]
  >([]);

  useEffect(() => {
    // Initialize local state from props
    const mapped = allocations.map((alloc) => ({
      id: alloc.id,
      charity_id: alloc.charity_id,
      charityName: alloc.charity.name,
      percentage: alloc.percentage * 100, // Convert to percentage (0-100)
    }));
    setLocalAllocations(mapped);
  }, [allocations]);

  /**
   * ⭐ THE SMART BALANCING LOGIC ⭐
   * Ensures total allocation always equals 100%
   */
  const handleSliderChange = (charityId: number, newValue: number) => {
    const currentIndex = localAllocations.findIndex((a) => a.charity_id === charityId);
    if (currentIndex === -1) return;

    const currentValue = localAllocations[currentIndex].percentage;
    const delta = newValue - currentValue;

    // Calculate the sum of all other allocations
    const otherAllocations = localAllocations.filter((a) => a.charity_id !== charityId);
    const otherTotal = otherAllocations.reduce((sum, a) => sum + a.percentage, 0);

    // If increasing this charity, we need to decrease others proportionally
    if (delta > 0) {
      const maxIncrease = 100 - newValue; // Space available for others
      if (otherTotal < delta) {
        // Can't increase by that much - cap it
        newValue = 100 - otherTotal;
      }
    }

    // Create new allocations array
    const updatedAllocations = [...localAllocations];
    updatedAllocations[currentIndex] = {
      ...updatedAllocations[currentIndex],
      percentage: newValue,
    };

    // Calculate how much to distribute among others
    const remainingPercentage = 100 - newValue;

    // Distribute the remaining percentage proportionally among other charities
    if (otherTotal > 0) {
      otherAllocations.forEach((alloc) => {
        const index = updatedAllocations.findIndex((a) => a.charity_id === alloc.charity_id);
        const proportion = alloc.percentage / otherTotal;
        updatedAllocations[index] = {
          ...updatedAllocations[index],
          percentage: remainingPercentage * proportion,
        };
      });
    } else {
      // If all others are 0, distribute equally
      const equalShare = remainingPercentage / otherAllocations.length;
      otherAllocations.forEach((alloc) => {
        const index = updatedAllocations.findIndex((a) => a.charity_id === alloc.charity_id);
        updatedAllocations[index] = {
          ...updatedAllocations[index],
          percentage: equalShare,
        };
      });
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
              <span className="text-lg font-bold" style={{ color: '#fabe36' }}>
                {formatDisplayValue(alloc.percentage)}
              </span>
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
                className="w-full h-3 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, #fabe36 0%, #fabe36 ${alloc.percentage}%, #e5e7eb ${alloc.percentage}%, #e5e7eb 100%)`,
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
