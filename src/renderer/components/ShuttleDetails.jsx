import React, { useState, useEffect } from 'react';
import LiveLogViewer from './LiveLogViewer';
import QuickActions from './QuickActions';
import MovementConfig from './MovementConfig';
import SystemTime from './SystemTime';

const ShuttleDetails = () => {
  const [shuttle, setShuttle] = useState(null);
  const [logs, setLogs] = useState([
    '[2023-10-27 10:00:01] INFO: System Initialized. Awaiting commands.',
    '[2023-10-27 10:00:05] DEBUG: Heartbeat signal received.',
    '[2023-10-27 10:00:10] WARN: Battery level below 90%.',
    '[2023-10-27 10:00:15] INFO: Listening for incoming connections...',
    '[2023-10-27 10:00:20] ERROR: Sensor B failed to respond. Code: E-502.',
    '[2023-10-27 10:00:22] INFO: Command received: LOAD',
    '[2023-10-27 10:00:25] DEBUG: Actuator A engaged.',
  ]);

  useEffect(() => {
    const removeListener = window.api.on('shuttle-data', (data) => {
      setShuttle(data);
    });

    return () => {
      removeListener();
    };
  }, []);

  if (!shuttle) {
    return <div>Loading...</div>;
  }

  return (
    <div className="flex h-screen w-full flex-col">
      <header className="flex-shrink-0 border-b border-border-light dark:border-border-dark px-6 py-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xl font-bold tracking-tight">{shuttle.name} | {shuttle.ip}</p>
          <button className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-md h-9 px-4 bg-panel-light dark:bg-panel-dark text-sm font-medium border border-border-light dark:border-border-dark hover:bg-gray-100 dark:hover:bg-gray-700">
            <span className="truncate">DISCONNECT</span>
          </button>
        </div>
      </header>
      <div className="flex-shrink-0 border-b border-border-light dark:border-border-dark px-6 py-2">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary">Status:</p>
            <div className="flex items-center gap-1.5">
              <div className={`h-2.5 w-2.5 rounded-full ${shuttle.status === 'Stand By' ? 'bg-[#FFC107]' : 'bg-red-500'}`}></div>
              <p className="text-sm font-semibold">{shuttle.status}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary">Battery:</p>
            <p className="text-sm font-semibold">{shuttle.battery}%</p>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary">Voltage:</p>
            <p className="text-sm font-semibold">24.5V</p>
          </div>
          <div className="flex items-center gap-2">
            <p className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary">Error:</p>
            <p className="text-sm font-semibold">None</p>
          </div>
        </div>
      </div>
      <main className="flex flex-1 flex-col lg:flex-row gap-6 p-6 overflow-hidden">
        <LiveLogViewer logs={logs} />
        <div className="flex flex-col w-full lg:w-[30%] gap-4 overflow-y-auto">
          <QuickActions />
          <MovementConfig />
          <SystemTime />
        </div>
      </main>
    </div>
  );
};

export default ShuttleDetails;
