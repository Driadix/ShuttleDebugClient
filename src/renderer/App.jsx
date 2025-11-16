import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import EmptyState from './components/EmptyState';

function App() {
  // Mock data for hubs, replace with actual data later
  const hubs = [
    { id: 1, name: 'Shuttle 18', ip: '192.168.40.72', status: 'Stand By', battery: 88, selected: true, details: { firmware: 'v2.1.4', mac: '30:AE:A4:23:C8:58', uptime: '7h 14m 32s', signal: '-65 dBm' } },
    { id: 2, name: 'Lab Sensor Array', ip: '192.168.40.113', status: 'Error', battery: 15, selected: false, details: { firmware: 'v1.0.2', mac: 'A0:B1:C2:D3:E4:F5', uptime: '1d 2h 5m', signal: '-72 dBm' } },
    { id: 3, name: 'Factory Monitor', ip: '192.168.40.201', status: 'Loading', battery: 99, selected: false, details: { firmware: 'v3.5.0', mac: 'B1:C2:D3:E4:F5:A6', uptime: '22h 45m', signal: '-55 dBm' } },
  ];

  const [selectedHub, setSelectedHub] = useState(hubs.find(hub => hub.selected));

  return (
    <div className="flex h-screen w-full bg-background-light dark:bg-background-dark font-display text-text-primary-light dark:text-text-primary-dark">
      <Sidebar hubs={hubs} onSelectHub={setSelectedHub} selectedHub={selectedHub} />
      <main className="flex-1 overflow-y-auto bg-background-light dark:bg-background-dark p-8">
        <div className="mx-auto max-w-5xl">
          {selectedHub ? <MainContent hub={selectedHub} /> : <EmptyState />}
        </div>
      </main>
    </div>
  );
}

export default App;
