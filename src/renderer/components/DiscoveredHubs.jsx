import React from 'react';

const DiscoveredHubs = ({ hubs, onSelectHub, selectedHubId }) => {
  return (
    <div className="flex flex-col gap-1 p-2">
      {hubs.map(hub => (
        <div
          key={hub.id}
          onClick={() => {
            onSelectHub(hub); // This just highlights it
            window.api.invoke('open-shuttle-details', hub); // This opens the window
          }}
          className={`flex flex-col rounded-md px-3 py-2 cursor-pointer transition-colors ${selectedHubId === hub.id ? 'bg-primary/10 dark:bg-primary/20 ring-2 ring-primary' : 'hover:bg-gray-100 dark:hover:bg-white/5'}`}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold">{hub.name}</p>
            <p className="text-xs text-text-light-secondary dark:text-text-dark-secondary">{hub.ip}</p>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-xs">Status: {hub.status}</p>
            <p className="text-xs">Battery: {hub.battery}%</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default DiscoveredHubs;
