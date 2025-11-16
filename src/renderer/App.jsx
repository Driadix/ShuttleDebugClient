import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import EmptyState from './components/EmptyState';

function App() {
  const [hubs, setHubs] = useState([]);
  const [scanStatus, setScanStatus] = useState({ percent: 0, ip: '', complete: false });
  const [selectedHubId, setSelectedHubId] = useState(null);

  // --- MOCK DATA ---
  useEffect(() => {
    setHubs([
      { id: '192.168.40.72', name: 'Shuttle 18', ip: '192.168.40.72', status: 'Stand By', battery: 88 },
      { id: '192.168.40.75', name: 'Shuttle 19', ip: '192.168.40.75', status: 'Error', battery: 22 },
    ]);
  }, []);

  // --- API Event Listeners ---
  useEffect(() => {
    if (window.api) {
      const removeScanProgressListener = window.api.on('scan-progress', ({ ip, percent }) => {
        setScanStatus({ percent, ip, complete: false });
      });

      const removeHubFoundListener = window.api.on('hub-found', (hub) => {
        setHubs(prev => [...prev, hub]);
      });

      // Listen for disconnects to deselect in sidebar
      const removeDisconnectListener = window.api.on('hub-disconnected', () => {
        setSelectedHubId(null);
      });

      return () => {
        removeScanProgressListener();
        removeHubFoundListener();
        removeDisconnectListener();
      };
    }
  }, []);


  // --- API Callbacks ---
  const handleStartScan = async () => {
    setHubs([]); // Clear existing hubs
    setScanStatus({ percent: 0, ip: 'Starting...', complete: false });
    setSelectedHubId(null);
    const result = await window.api.invoke('start-scan', { start: '192.168.40.1', end: '192.168.40.254', timeout: 500 });
    setScanStatus({ percent: 100, ip: result, complete: true });
  };

  const handleSelectHub = (hub) => {
    setSelectedHubId(hub.id);
    // The DiscoveredHubs component now handles opening the window
  };

  return (
    <div className="flex h-screen w-full bg-background-light dark:bg-background-dark font-display text-text-light-primary dark:text-text-dark-primary">
      <Sidebar
        hubs={hubs}
        onSelectHub={handleSelectHub}
        selectedHubId={selectedHubId}
        onScan={handleStartScan}
        scanStatus={scanStatus}
      />
      <main className="flex-1 overflow-hidden">
        <EmptyState />
      </main>
    </div>
  );
}

export default App;
