import React, { useState } from 'react';
import { HardDriveDownload, Wifi, BatteryHalf, BatteryFull, BatteryLow, XCircle, Loader, CheckCircle } from 'lucide-react';
import DiscoveredHubs from './DiscoveredHubs';
import ScannerControl from './ScannerControl';

const Sidebar = ({ hubs, onSelectHub, selectedHub }) => {
  return (
    <aside className="flex w-full max-w-xs flex-col border-r border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
      <div className="flex h-16 shrink-0 items-center gap-3 border-b border-border-light dark:border-border-dark px-6">
        <div className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-8" style={{backgroundImage: 'url("https://lh3.googleusercontent.com/aida-public/AB6AXuADwWpX5P2EYvc54sq9bb8IJ3CxVHfGRJDdxUqB2Im0_DSR9_3G2pLpd0cmEuUsPFNP8h8FYsotUhwTjeiDwN_qPg3hgSY1CBKZiwEOPjDVXFhsOOLL2kF_kLa9Z-aYIx2RktVSi8QnN35fk_07UxrlFxsvYnl7dRyFTtRs-Q0F1AkmKJ30tKgfu4uJVffbGF4Zz3jAxxraGHLfqnPBetYPMos2C-9IboaDMoYEqWcYP85TVPWBqyNf4TnI0cj-M6varNYgI62owauk")'}}></div>
        <div className="flex flex-col">
          <h1 className="text-base font-semibold leading-none text-text-primary-light dark:text-text-primary-dark">ESP32 Hubs</h1>
          <p className="text-sm font-normal leading-none text-text-secondary-light dark:text-text-secondary-dark">Control Panel</p>
        </div>
      </div>
      <ScannerControl />
      <DiscoveredHubs hubs={hubs} onSelectHub={onSelectHub} selectedHub={selectedHub} />
    </aside>
  );
};

export default Sidebar;
