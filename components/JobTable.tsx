'use client';

import { useEffect, useState } from 'react';
import { List } from 'lucide-react';

export default function JobTable() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchJobs = (cursor?: string) => {
    setLoading(true);
    const url = cursor ? `/api/jobs?cursor=${cursor}` : '/api/jobs';
    fetch(url)
      .then(res => res.json())
      .then(json => {
        if (json.data) {
          if (cursor) {
            setJobs(prev => {
              // Avoid duplicates if polling happens while loading more
              const existingIds = new Set(prev.map(j => j.id));
              const newJobs = json.data.filter((j: any) => !existingIds.has(j.id));
              return [...prev, ...newJobs];
            });
          } else {
            setJobs(json.data);
          }
          setNextCursor(json.nextCursor);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(() => fetchJobs(), 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-sm col-span-1 md:col-span-3">
      <div className="flex items-center gap-2 mb-4">
        <List className="w-5 h-5 text-indigo-400" />
        <h2 className="text-lg font-medium text-white">Recent Jobs</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-neutral-400">
          <thead className="text-xs uppercase bg-neutral-800 text-neutral-300">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Priority</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Retries</th>
              <th className="px-4 py-3">Latency</th>
            </tr>
          </thead>
          <tbody>
            {jobs.map((job) => (
              <tr key={job.id} className="border-b border-neutral-800">
                <td className="px-4 py-3 font-mono text-xs">{job.id.substring(0, 8)}...</td>
                <td className="px-4 py-3 capitalize">{job.type}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    job.priority === 'critical' ? 'bg-red-500/20 text-red-400' :
                    job.priority === 'normal' ? 'bg-blue-500/20 text-blue-400' :
                    'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {job.priority}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded text-xs ${
                    job.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                    job.status === 'failed' || job.status === 'dead_lettered' ? 'bg-red-500/20 text-red-400' :
                    'bg-yellow-500/20 text-yellow-400'
                  }`}>
                    {job.status}
                  </span>
                </td>
                <td className="px-4 py-3">{job.retryCount}</td>
                <td className="px-4 py-3">{job.latencyMs ? `${job.latencyMs}ms` : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {nextCursor && (
        <div className="mt-4 flex justify-center">
          <button 
            onClick={() => fetchJobs(nextCursor)}
            disabled={loading}
            className="px-4 py-2 bg-neutral-800 text-white rounded hover:bg-neutral-700 disabled:opacity-50 text-sm transition-colors"
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
