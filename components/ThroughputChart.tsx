'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Activity } from 'lucide-react';

export default function ThroughputChart() {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/metrics/history?window=1h')
      .then(res => res.json())
      .then(json => {
        if (Array.isArray(json)) {
          const formatted = json.map(item => ({
            time: new Date(item.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            throughput: item.jobsProcessedLastMinute,
          }));
          setData(formatted);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-sm col-span-1">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-indigo-400" />
        <h2 className="text-lg font-medium text-white">Throughput (jobs/min)</h2>
      </div>
      <div className="h-64 w-full mt-4">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#262626" vertical={false} />
            <XAxis dataKey="time" stroke="#a3a3a3" tickLine={false} axisLine={false} />
            <YAxis stroke="#a3a3a3" tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#171717', border: '1px solid #262626', borderRadius: '8px' }}
            />
            <Line type="monotone" dataKey="throughput" stroke="#8b5cf6" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
