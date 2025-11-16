import React, { useState, useEffect } from 'react';
import { MemoryRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import ShuttleDetails from "./components/ShuttleDetails";

function App() {
  const [hubs, setHubs] = useState([]);
  const [scanStatus, setScanStatus] = useState({ percent: 0, ip: '', complete: false });
  const [selectedHub, setSelectedHub] = useState(null);
  const [logs, setLogs] = useState([]);
  const [connectionStatus, setConnectionStatus] = useState('disconnected'); // disconnected, connecting, connected, error
  const [telemetry, setTelemetry] = useState(null);

  // --- MOCK DATA ---
  // In a real scenario, this would be empty and populated by the scan.
  useEffect(() => {
    setHubs([
      { id: '192.168.40.72', name: 'Shuttle 18', ip: '192.168.40.72', status: 'Stand By', battery: 88, details: { firmware: 'v1.0.0', mac: 'AB:CD:EF:12:34:56', uptime: '2h 15m', signal: '-55dBm' } },
      { id: '192.168.40.75', name: 'Shuttle 19', ip: '192.168.40.75', status: 'Error', battery: 22, details: { firmware: 'v1.0.0', mac: 'FE:DC:BA:65:43:21', uptime: '1d 4h', signal: '-72dBm' } },
    ]);
  }, []);

  // --- API Event Listeners ---
  useEffect(() => {
    const removeScanProgressListener = window.api.on('scan-progress', ({ ip, percent }) => {
      setScanStatus({ percent, ip, complete: false });
    });

    const removeHubFoundListener = window.api.on('hub-found', (hub) => {
      setHubs(prev => [...prev, hub]);
    });

    const removeLogListener = window.api.on('log-received', (log) => {
      setLogs(prev => [...prev, log]);
    });

    const removeDisconnectListener = window.api.on('hub-disconnected', () => {
      setConnectionStatus('disconnected');
      setSelectedHub(null);
      setTelemetry(null);
    });

     const removeTelemetryListener = window.api.on('telemetry-update', (data) => {
      setTelemetry(data);
       if (selectedHub) {
         setSelectedHub(prev => ({...prev, status: data.status, battery: data.battery}));
       }
    });


    return () => {
      removeScanProgressListener();
      removeHubFoundListener();
      removeLogListener();
      removeDisconnectListener();
      removeTelemetryListener();
    };
  }, [selectedHub]);


  // --- API Callbacks ---
  const handleStartScan = async () => {
    setHubs([]); // Clear existing hubs
    setScanStatus({ percent: 0, ip: 'Starting...', complete: false });
    const result = await window.api.invoke('start-scan', { start: '192.168.40.1', end: '192.168.40.254', timeout: 500 });
    setScanStatus({ percent: 100, ip: result, complete: true });
  };

  const handleSelectHub = async (hub) => {
    if (selectedHub && selectedHub.id === hub.id) return;

    if (connectionStatus === 'connected') {
      await handleDisconnect();
    }

    setSelectedHub(hub);
    setConnectionStatus('connecting');
    setLogs([`[INFO] Attempting to connect to ${hub.ip}...`]);
    setTelemetry(null); // Clear old telemetry

    try {
      await window.api.invoke('connect-hub', hub.ip);
      setConnectionStatus('connected');
    } catch (error) {
      setLogs(prev => [...prev, `[ERROR] ${error.message}`]);
      setConnectionStatus('error');
      setSelectedHub(null); // Deselect on failure
    }
  };

  const handleDisconnect = async () => {
    await window.api.invoke('disconnect-hub');
    // The 'hub-disconnected' event will handle state changes
  };

  const handleSendCommand = (command) => {
    window.api.send('send-command', command);
  };

  const handleSaveLog = async () => {
    const logString = logs.join('\n');
    const result = await window.api.invoke('save-log', logString);
    if (result.success) {
      setLogs(prev => [...prev, `[INFO] Log saved to ${result.path}`]);
    } else {
      setLogs(prev => [...prev, `[ERROR] Log save failed: ${result.error}`]);
    }
  };


  return (
    <Router>
      <Routes>
        <Route path="/" element={
          <div className="flex h-screen w-full bg-background-light dark:bg-background-dark font-display text-text-light-primary dark:text-text-dark-primary">
            <Sidebar
              hubs={hubs}
              onSelectHub={handleSelectHub}
              selectedHub={selectedHub}
              onScan={handleStartScan}
              scanStatus={scanStatus}
              connectionStatus={connectionStatus}
            />
            <MainContent
              selectedHub={selectedHub}
              logs={logs}
              onDisconnect={handleDisconnect}
              onSendCommand={handleSendCommand}
              connectionStatus={connectionStatus}
              telemetry={telemetry}
              onSaveLog={handleSaveLog}
            />
          </div>
        } />
        <Route path="/shuttle/:id" element={<ShuttleDetails />} />
      </Routes>
    </Router>
  );
}

export default App;
