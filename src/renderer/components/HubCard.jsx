import React from 'react';

// Maps battery level to a Material Symbols icon
const getBatteryIcon = (battery) => {
  if (battery > 95) return 'battery_full';
  if (battery > 80) return 'battery_horiz_075';
  if (battery > 50) return 'battery_horiz_050';
  if (battery > 20) return 'battery_horiz_000'; // Using this for low
  return 'battery_alert';
};

// Maps status string to a color and style
const getStatusStyle = (status) => {
  const s = status.toLowerCase();
  if (s.includes('error')) {
    return {
      text: 'Error',
      dot: 'bg-red-500',
      badge: 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400'
    };
  }
  if (s.includes('load') || s.includes('run')) {
    return {
      text: 'Busy',
      dot: 'bg-blue-500',
      badge: 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400'
    };
  }
  if (s.includes('offline')) {
    return {
      text: 'Offline',
      dot: 'bg-gray-500',
      badge: 'bg-gray-100 dark:bg-gray-700/20 text-gray-600 dark:text-gray-400'
    };
  }
  // Default to Stand By
  return {
    text: 'Stand By',
    dot: 'bg-green-500',
    badge: 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400'
  };
};

const HubCard = ({ hub }) => {
  
  const handleDoubleClick = () => {
    // Per TechSpec 2.3.1, open details on double click
    window.api.invoke('open-shuttle-details', hub);
  };

  const statusStyle = getStatusStyle(hub.status);
  const batteryIcon = getBatteryIcon(hub.battery);

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className="rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-4 flex flex-col gap-3 cursor-pointer select-none transition-all hover:shadow-md hover:dark:shadow-primary/10 hover:-translate-y-0.5"
    >
      <div className="flex items-center justify-between">
        <p className="font-semibold text-text-primary-light dark:text-text-primary-dark">{hub.name}</p>
        <div className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ${statusStyle.badge}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`}></span>
          <span>{statusStyle.text}</span>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark font-mono">{hub.ip}</p>
        <div className="flex items-center gap-1 text-sm text-text-secondary-light dark:text-text-secondary-dark">
          <span className="material-symbols-outlined !text-base">{batteryIcon}</span>
          <span>{hub.battery}%</span>
        </div>
      </div>
    </div>
  );
};

export default HubCard;