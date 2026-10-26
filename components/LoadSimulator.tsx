'use client';

import { useState } from 'react';
import { Play } from 'lucide-react';

export default function LoadSimulator() {
  const [jobCount, setJobCount] = useState(100);
  const [priority, setPriority] = useState('normal');
  const [loading, setLoading] = useState(false);

  const handleSimulate = async () => {
    setLoading(true);
    try {
      await fetch('/api/simulate/load', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ jobCount, priority })
      });
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-sm col-span-1 md:col-span-3 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <Play className="w-5 h-5 text-indigo-400" />
        <h2 className="text-lg font-medium text-white">Load Simulator</h2>
      </div>
      <div className="flex flex-col sm:flex-row items-end gap-6 mt-4">
        <div className="w-full sm:w-1/2">
          <label className="block text-sm text-neutral-400 mb-2">
            Job Count: <span className="text-white font-mono">{jobCount}</span>
          </label>
          <input 
            type="range" 
            min="1" 
            max="500" 
            value={jobCount}
            onChange={(e) => setJobCount(parseInt(e.target.value, 10))}
            className="w-full h-2 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        <div className="w-full sm:w-1/3">
          <label className="block text-sm text-neutral-400 mb-2">Priority</label>
          <select 
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full bg-neutral-800 border border-neutral-700 text-white rounded px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
          >
            <option value="critical">Critical</option>
            <option value="normal">Normal</option>
            <option value="low">Low</option>
          </select>
        </div>
        <button
          onClick={handleSimulate}
          disabled={loading}
          className="w-full sm:w-auto px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-medium disabled:opacity-50 transition-colors"
        >
          {loading ? 'Firing...' : 'Fire Jobs'}
        </button>
      </div>
    </div>
  );
}
