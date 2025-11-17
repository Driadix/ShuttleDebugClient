import React, { useState, useEffect } from 'react';
import ScannerControl from './ScannerControl';
import HubCard from './HubCard';
import { Network } from 'lucide-react'; // Import a lucide icon

// This component is the new main dashboard screen
const Dashboard = () => {
  const [hubs, setHubs] = useState([]);
  const [scanStatus, setScanStatus] = useState({ percent: 0, ip: '', complete: true });

  // --- API Event Listeners ---
  useEffect(() => {
    // 1. Listen for scan progress
    const removeScanProgressListener = window.api.on('scan-progress', ({ ip, percent }) => {
      setScanStatus({ percent, ip, complete: false });
    });

    // 2. Listen for a single hub being found (during manual scan)
    const removeHubFoundListener = window.api.on('hub-found', (hub) => {
      setHubs(prev => {
        // Add or update the hub
        const newHubs = [...prev.filter(h => h.ip !== hub.ip), hub];
        return newHubs;
      });
    });
    
    // 3. Listen for batch updates (from background liveness scan) [cite: 178, 248]
    const removeHubsUpdatedListener = window.api.on('hubs-updated', (updatedHubs) => {
      setHubs(updatedHubs);
    });

    // 4. Listen for disconnects (e.g., window closed) to update UI
    //    This is an optimistic update. The liveness scan will confirm.
    const removeDisconnectListener = window.api.on('hub-disconnected', (ip) => {
      setHubs(prev => prev.map(hub => 
        hub.ip === ip ? { ...hub, status: 'Offline' } : hub
      ));
    });

    // --- Initial Scan ---
    // Trigger the initial scan on dashboard load [cite: 48, 87]
    handleStartScan();

    // Cleanup
    return () => {
      removeScanProgressListener();
      removeHubFoundListener();
      removeHubsUpdatedListener();
      removeDisconnectListener();
    };
  }, []);


  // --- API Callbacks ---
  const handleStartScan = async (scanParams) => {
    setHubs([]); // Clear existing hubs for a manual scan [cite: 95]
    setScanStatus({ percent: 0, ip: 'Starting...', complete: false });
    
    // Call 'start-scan'. If scanParams is undefined, main.js will use defaults
    // from config.json. [cite: 87, 158]
    const result = await window.api.invoke('start-scan', scanParams);
    
    setScanStatus({ percent: 100, ip: result, complete: true });
  };

  return (
    <div className="flex h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display text-text-light-primary dark:text-text-dark-primary">
      {/* Header */}
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark px-6">
        <div className="flex items-center gap-3">
          {/* Logo Replaced with Icon */}
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 text-primary">
            <Network size={18} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-base font-semibold leading-none text-text-primary-light dark:text-text-primary-dark">ESP32 Hubs</h1>
            <p className="text-sm font-normal leading-none text-text-secondary-light dark:text-text-secondary-dark">Shuttle Dashboard</p>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-8">
        <div className="mx-auto max-w-7xl">
          {/* Scanner Control Box */}
          <div className="mb-8 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-6">
            <ScannerControl onScan={handleStartScan} scanStatus={scanStatus} />
          </div>
          
          {/* Hub Grid */}
          {hubs.length > 0 ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {hubs.map(hub => (
                <HubCard key={hub.id} hub={hub} />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-12 text-center">
              <svg className="mx-auto h-12 w-12 text-text-secondary-light dark:text-text-secondary-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 className="mt-2 text-sm font-semibold text-text-primary-light dark:text-text-primary-dark">No Hubs Discovered</h3>
              <p className="mt-1 text-sm text-text-secondary-light dark:text-text-secondary-dark">
                {scanStatus.complete ? "Click 'Start Scan' to find hubs." : "Scan in progress..."}
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;