import React from 'react';
import { Wifi, BatteryHalf, BatteryFull, BatteryLow, XCircle, Loader, CheckCircle } from 'lucide-react';

const DiscoveredHubs = ({ hubs, onSelectHub, selectedHub }) => {
  const getStatusIcon = (status) => {
    switch (status) {
      case 'Stand By':
        return <CheckCircle className="text-green-500" size={16} />;
      case 'Error':
        return <XCircle className="text-red-500" size={16} />;
      case 'Loading':
        return <Loader className="animate-spin text-blue-500" size={16} />;
      default:
        return null;
    }
  };

  const getBatteryIcon = (level) => {
    if (level > 75) return <BatteryFull size={16} />;
    if (level > 25) return <BatteryHalf size={16} />;
    return <BatteryLow size={16} />;
  };

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark px-2 mb-2">Discovered Hubs</h3>
      {hubs.map(hub => (
        <div
          key={hub.id}
          onClick={() => {
            onSelectHub(hub);
            window.api.invoke('open-shuttle-details', hub);
          }}
          className={`flex cursor-pointer flex-col gap-1 rounded-lg p-3 transition-colors ${selectedHub && selectedHub.id === hub.id ? 'bg-primary/10 dark:bg-primary/20 ring-2 ring-primary' : 'hover:bg-gray-100 dark:hover:bg-white/5'}`}
        >
          <div className="flex items-center justify-between">
            <p className="font-semibold text-text-primary-light dark:text-text-primary-dark">{hub.name}</p>
            <div className="flex items-center gap-2 text-xs font-medium">
              {getStatusIcon(hub.status)}
              <span>{hub.status}</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <p className="text-sm text-text-secondary-light dark:text-text-secondary-dark">{hub.ip}</p>
            <div className="flex items-center gap-1 text-sm text-text-secondary-light dark:text-text-secondary-dark">
              {getBatteryIcon(hub.battery)}
              <span>{hub.battery}%</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DiscoveredHubs;
