import React from 'react';

const RealtimeLogs = () => {
  const logs = [
    { type: 'INFO', message: 'Connecting to WiFi...' },
    { type: 'INFO', message: 'WiFi connected. IP: 192.168.40.72' },
    { type: 'INFO', message: 'MQTT client connected.' },
    { type: 'INFO', message: 'Subscribed to topic: hubs/shuttle-18/commands' },
    { type: 'WARN', message: 'Sensor reading threshold exceeded: 75.3C' },
    { type: 'INFO', message: 'Publishing sensor data...' },
    { type: 'INFO', message: 'Heartbeat sent.' },
    { type: 'INFO', message: 'Publishing sensor data...' },
    { type: 'INFO', message: 'Heartbeat sent.' },
    { type: 'ERROR', message: 'Failed to read from I2C device at address 0x27' },
    { type: 'INFO', message: 'Publishing sensor data...' },
    { type: 'INFO', message: 'Heartbeat sent.' },
  ];

  const getLogColor = (type) => {
    switch (type) {
      case 'INFO':
        return 'text-green-500';
      case 'WARN':
        return 'text-yellow-500';
      case 'ERROR':
        return 'text-red-500';
      default:
        return '';
    }
  };

  return (
    <div className="mt-6 rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
      <div className="border-b border-border-light dark:border-border-dark p-4">
        <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">Real-time Logs</h3>
      </div>
      <div className="h-80 overflow-y-auto p-4 font-mono text-xs">
        {logs.map((log, index) => (
          <p key={index}>
            <span className={getLogColor(log.type)}>[{log.type}]</span> {log.message}
          </p>
        ))}
      </div>
    </div>
  );
};

export default RealtimeLogs;
