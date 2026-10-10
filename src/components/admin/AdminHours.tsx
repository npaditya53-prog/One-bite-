import React, { useState } from 'react';
import { useRestaurant } from '../../context/RestaurantContext.tsx';
import { BusinessDayHours } from '../../types/index.ts';
import { useToast } from '../common/Toast.tsx';
import { Clock, Save, CheckCircle2 } from 'lucide-react';

export function AdminHours() {
  const { businessHours, saveBusinessHours, openStatus } = useRestaurant();
  const { showToast } = useToast();

  const [hours, setHours] = useState<BusinessDayHours[]>(JSON.parse(JSON.stringify(businessHours)));
  const [isSaving, setIsSaving] = useState(false);

  const handleDayChange = (index: number, field: keyof BusinessDayHours, value: any) => {
    const updated = [...hours];
    updated[index] = { ...updated[index], [field]: value };
    setHours(updated);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await saveBusinessHours(hours);
      showToast('Business hours saved successfully!', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to save business hours', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-stone-900">Operating Hours Schedule</h1>
          <p className="text-xs sm:text-sm text-stone-500">
            Configure weekly restaurant opening and closing hours. Status badges automatically adapt to local India time (IST).
          </p>
        </div>

        {/* Live Status indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-stone-200 text-xs font-semibold">
          <span
            className={`w-2 h-2 rounded-full ${
              openStatus.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
            }`}
          />
          <span className={openStatus.isOpen ? 'text-emerald-700' : 'text-rose-700'}>
            Current Live Status: {openStatus.isOpen ? 'Open Now' : 'Closed'}
          </span>
        </div>
      </div>

      <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-stone-200 shadow-xs space-y-6">
        <div className="divide-y divide-stone-100">
          {hours.map((bh, idx) => (
            <div
              key={bh.id || bh.day}
              className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="sm:w-36 font-bold text-sm text-stone-900">{bh.day}</div>

              <div className="flex-1 flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-stone-500">Open:</span>
                  <input
                    type="time"
                    disabled={bh.closed}
                    value={bh.openTime}
                    onChange={e => handleDayChange(idx, 'openTime', e.target.value)}
                    className="px-3 py-1.5 border border-stone-200 rounded-lg text-xs font-mono disabled:bg-stone-100 disabled:text-stone-400"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-stone-500">Close:</span>
                  <input
                    type="time"
                    disabled={bh.closed}
                    value={bh.closeTime}
                    onChange={e => handleDayChange(idx, 'closeTime', e.target.value)}
                    className="px-3 py-1.5 border border-stone-200 rounded-lg text-xs font-mono disabled:bg-stone-100 disabled:text-stone-400"
                  />
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-stone-700 ml-auto sm:ml-4">
                  <input
                    type="checkbox"
                    checked={bh.closed}
                    onChange={e => handleDayChange(idx, 'closed', e.target.checked)}
                    className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                  />
                  <span>Mark as Closed</span>
                </label>
              </div>
            </div>
          ))}
        </div>

        <div className="pt-6 border-t border-stone-100 flex items-center justify-between">
          <span className="text-xs text-stone-500">
            India Standard Time (IST - UTC+05:30) evaluated automatically.
          </span>

          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 py-2.5 px-6 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs sm:text-sm shadow-xs transition-colors cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Hours Schedule'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
