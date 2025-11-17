import React from 'react';
import {
  BatteryFull,
  BatteryMedium,
  BatteryLow,
  BatteryWarning,
  Loader,
  CheckCircle,
  XCircle,
  WifiOff
} from 'lucide-react';

// Maps battery level to a Lucide icon
const getBatteryIcon = (battery) => {
  if (battery > 95) return <BatteryFull size={16} />;
  if (battery > 80) return <BatteryFull size={16} className="!text-[18px]" />; // Lucide doesn't have 75%
  if (battery > 50) return <BatteryMedium size={16} />;
  if (battery > 20) return <BatteryLow size={16} />;
  return <BatteryWarning size={16} />;
};

// Maps status string to a color and style
const getStatusStyle = (status) => {
  const s = status.toLowerCase();
  if (s.includes('error')) {
    return {
      text: 'Error',
      dot: 'bg-red-500',
      badge: 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400',
      icon: <XCircle size={16} />
    };
  }
  if (s.includes('load') || s.includes('run')) {
    return {
      text: 'Busy',
      dot: 'bg-blue-500',
      badge: 'bg-blue-100 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400',
      icon: <Loader size={16} className="animate-spin" />
    };
  }
  if (s.includes('offline')) {
    return {
      text: 'Offline',
      dot: 'bg-gray-500',
      badge: 'bg-gray-100 dark:bg-gray-700/20 text-gray-600 dark:text-gray-400',
      icon: <WifiOff size={16} />
    };
  }
  // Default to Stand By
  return {
    text: 'Stand By',
    dot: 'bg-green-500',
    badge: 'bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400',
    icon: <CheckCircle size={16} />
  };
};

const HubCard = ({ hub }) => {
  
  const handleDoubleClick = () => {
    // Per TechSpec 2.3.1, open details on double click [cite: 50, 256]
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
          {batteryIcon}
          <span>{hub.battery}%</span>
        </div>
      </div>
    </div>
  );
};

export default HubCard;