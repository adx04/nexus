'use client';

import QueueDepthChart from './QueueDepthChart';
import ThroughputChart from './ThroughputChart';
import LatencyChart from './LatencyChart';
import JobTable from './JobTable';
import LoadSimulator from './LoadSimulator';
import { useMetricsStream } from '@/hooks/useMetricsStream';

export default function Dashboard() {
  const { snapshot, isWorkerAlive } = useMetricsStream();

  return (
    <>
      <div className="flex justify-end mb-4">
        <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2 ${isWorkerAlive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
          <div className={`w-2 h-2 rounded-full ${isWorkerAlive ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
          Worker {isWorkerAlive ? 'Alive' : 'Dead'}
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QueueDepthChart snapshot={snapshot} />
        <ThroughputChart />
        <LatencyChart />
        <JobTable />
        <LoadSimulator />
      </div>
    </>
  );
}
