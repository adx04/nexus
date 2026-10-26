import Dashboard from '@/components/Dashboard';

export default function Home() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-50 font-sans p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="flex items-center justify-between border-b border-neutral-800 pb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Nexus</h1>
            <p className="text-neutral-400 mt-1">Distributed Job Orchestration Engine</p>
          </div>
        </header>
        <Dashboard />
      </div>
    </main>
  );
}
