import React, { useState, useEffect } from 'react';
        import LiveLogViewer from './LiveLogViewer';
        import StatsViewer from './StatsViewer'; // Import the new component
        import QuickActions from './QuickActions';
        import MovementConfig from './MovementConfig';
        import SystemTime from './SystemTime';

        const ShuttleDetails = () => {
          // This 'shuttle' state is only the *initial* static data
          const [shuttle, setShuttle] = useState(null); 

          // --- STATE for dynamic data ---
          const [logs, setLogs] = useState([]);
          const [telemetry, setTelemetry] = useState(null); // This holds the *latest* telemetry object
          const [lastTelemetryTime, setLastTelemetryTime] = useState(null); // NEW: Store update time
          const [connectionStatus, setConnectionStatus] = useState('connecting'); // connecting, connected, disconnected
          
          // --- NEW STATE for view toggling ---
          const [viewMode, setViewMode] = useState('logs'); // 'logs' | 'stats'

          // --- API Event Listeners ---
          useEffect(() => {
            // 1. Get initial static data (name, ip)
            const removeDataListener = window.api.on('shuttle-data', (data) => {
              setShuttle(data);
              setLogs(prev => [`[INFO] Opening details for ${data.name} (${data.ip})`]);

              // Now that we have the IP, try to connect
              window.api.invoke('connect-hub', data.ip)
                .catch(err => setLogs(prev => [...prev, `[ERROR] Initial connection failed: ${err.message}`]));
            });

            // 2. Listen for logs
            const removeLogListener = window.api.on('log-received', (log) => {
              // Limit logs to avoid performance issues
              // Read logCap from config [cite: 74]
              setLogs(prev => [...prev, log].slice(-5000));
            });

            // 3. Listen for telemetry
            const removeTelemetryListener = window.api.on('telemetry-update', (data) => {
              setTelemetry(data); // Always update telemetry regardless of view
              setLastTelemetryTime(new Date()); // NEW: Set update time
            });

            // 4. Listen for connection status
            const removeConnectListener = window.api.on('hub-connected', () => {
              setConnectionStatus('connected');
              setLogs(prev => [...prev, '[INFO] Hub connection established.']);
            });

            const removeDisconnectListener = window.api.on('hub-disconnected', () => {
              setConnectionStatus('disconnected');
              setLogs(prev => [...prev, '[WARN] Hub disconnected. Retrying...']);
            });

            return () => {
              removeDataListener();
              removeLogListener();
              removeTelemetryListener();
              removeConnectListener();
              removeDisconnectListener();
            };
          }, []);

          // --- Command Handlers ---
          const handleSendCommand = (command) => {
            if (connectionStatus === 'connected' && shuttle) {
              window.api.send('send-command', { ip: shuttle.ip, command: command });
            } else {
              setLogs(prev => [...prev, '[ERROR] Cannot send command: Not connected.']);
            }
          };

          const handleSaveLog = async () => {
            if (!shuttle) return;
            const logString = logs.join('\n');
            const result = await window.api.invoke('save-log', { ip: shuttle.ip, logs: logString });
            if (result.success) {
              setLogs(prev => [...prev, `[INFO] Log saved to ${result.path}`]);
            } else {
              setLogs(prev => [...prev, `[ERROR] Log save failed: ${result.error}`]);
            }
          };

          const handleClearLogs = () => {
            setLogs(['[INFO] Log cleared.']);
          };
 
           const handleDisconnect = () => {
             window.close();
           };
           
           // View change handler
           const handleViewChange = (mode) => {
             setViewMode(mode);
           };
 
           if (!shuttle) {
             return (
              <div className="flex h-screen items-center justify-center bg-background-light dark:bg-background-dark text-text-light-primary dark:text-text-dark-primary">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  Loading shuttle data...
                </div>
              </div>
             );
          }

          // Determine status display from live telemetry if available
          const status = telemetry ? telemetry.status_str : '...';
          const battery = telemetry ? telemetry.batt : '...';
          const voltage = telemetry ? telemetry.volt : '...';
          const error = telemetry ? (telemetry.err === 0 ? 'None' : `E-${telemetry.err}`) : '...';

          const isConnected = connectionStatus === 'connected';

          // Determine status text/color
          let statusText = 'Connecting...';
          let statusColor = 'bg-gray-500';
          if (connectionStatus === 'disconnected') {
            statusText = 'Reconnecting...';
            statusColor = 'bg-yellow-500';
          } else if (isConnected) {
            statusText = status;
            statusColor = (error === 'None') ? 'bg-green-500' : 'bg-red-500';
          }


          return (
            <div className="flex h-screen w-full flex-col bg-background-light dark:bg-background-dark font-display text-text-light-primary dark:text-text-dark-primary">
              <header className="flex-shrink-0 border-b border-border-light dark:border-border-dark px-6 py-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="text-xl font-bold tracking-tight">{shuttle.name} | {shuttle.ip}</p>
                  <button 
                    onClick={handleDisconnect}
                    className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-md h-9 px-4 bg-panel-light dark:bg-panel-dark text-sm font-medium border border-border-light dark:border-border-dark hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <span className="truncate">DISCONNECT</span>
                  </button>
                </div>
              </header>

              <div className="flex-shrink-0 border-b border-border-light dark:border-border-dark px-6 py-2">
                <div className="flex flex-wrap items-center gap-6">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary">Status:</p>
                    <div className="flex items-center gap-1.5">
                      <div className={`h-2.5 w-2.5 rounded-full ${statusColor}`}></div>
                      <p className="text-sm font-semibold">{statusText}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary">Battery:</p>
                    <p className="text-sm font-semibold">{isConnected ? `${battery}%` : '...'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary">Voltage:</p>
                    <p className="text-sm font-semibold">{isConnected ? `${voltage}V` : '...'}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-text-light-secondary dark:text-text-dark-secondary">Error:</p>
                    <p className="text-sm font-semibold">{isConnected ? error : '...'}</p>
                  </div>
                </div>
              </div>

              <main className="flex flex-1 flex-col lg:flex-row gap-6 p-6 overflow-hidden">
                {/* --- Conditional View Rendering --- */}
                {viewMode === 'logs' ? (
                  <LiveLogViewer
                      logs={logs}
                      onSaveLog={handleSaveLog}
                      onClearLogs={handleClearLogs}
                      onViewChange={handleViewChange}
                  />
                ) : (
                  <StatsViewer
                      telemetry={telemetry}
                      lastUpdated={lastTelemetryTime}
                      onViewChange={handleViewChange}
                  />
                )}
                
                <div className="flex flex-col w-full lg:w-[30%] gap-4 overflow-y-auto">
                  <QuickActions onSendCommand={handleSendCommand} isDisabled={!isConnected} />
                  <MovementConfig onSendCommand={handleSendCommand} isDisabled={!isConnected} />
                  <SystemTime onSendCommand={handleSendCommand} isDisabled={!isConnected} />
                </div>
              </main>
            </div>
          );
        };

        export default ShuttleDetails;