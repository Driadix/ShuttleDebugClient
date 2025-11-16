import React from 'react';
import ScannerControl from './ScannerControl';
import DiscoveredHubs from './DiscoveredHubs';

const Sidebar = ({ hubs, onSelectHub, selectedHubId, onScan, scanStatus }) => {
  return (
    <div className="flex h-full w-80 flex-col border-r border-border-light dark:border-border-dark bg-panel-light dark:bg-panel-dark">
      <ScannerControl onScan={onScan} scanStatus={scanStatus} />
      <div className="flex-1 overflow-y-auto">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark px-4 pt-4 pb-2">Discovered Hubs</h3>
        <DiscoveredHubs hubs={hubs} onSelectHub={onSelectHub} selectedHubId={selectedHubId} />
      </div>
    </div>
  );
};

export default Sidebar;
