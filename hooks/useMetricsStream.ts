'use client';

import { useState, useEffect } from 'react';

export function useMetricsStream() {
  const [snapshot, setSnapshot] = useState<any>(null);
  const [isWorkerAlive, setIsWorkerAlive] = useState(true);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      eventSource = new EventSource('/api/metrics/stream');

      eventSource.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.snapshot) setSnapshot(data.snapshot);
          setIsWorkerAlive(data.isWorkerAlive);
        } catch (e) {
          console.error('SSE parse error:', e);
        }
      };

      eventSource.onerror = () => {
        console.error('SSE connection lost, reconnecting...');
        eventSource?.close();
        reconnectTimeout = setTimeout(connect, 3000);
      };
    };

    connect();

    return () => {
      eventSource?.close();
      clearTimeout(reconnectTimeout);
    };
  }, []);

  return { snapshot, isWorkerAlive };
}
