import React, { useState } from 'react';

const ScannerControl = () => {
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState(0);

  const handleScan = () => {
    setScanning(true);
    // Simulate scanning progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setScanning(false);
          return 100;
        }
        return prev + 10;
      });
    }, 500);
  };

  return (
    <div className="flex flex-col gap-4 border-b border-border-light dark:border-border-dark p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark px-2">Scanner Control</h3>
      <div className="flex flex-col gap-3 px-2">
        <label className="flex w-full flex-col">
          <p className="text-sm font-medium leading-normal pb-1.5 text-text-primary-light dark:text-text-primary-dark">Start IP</p>
          <input className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 h-10 px-3 text-sm font-normal text-text-primary-light dark:text-text-primary-dark placeholder:text-text-secondary-light dark:placeholder:text-text-secondary-dark" placeholder="192.168.40.1" defaultValue="192.168.40.1" />
        </label>
        <label className="flex w-full flex-col">
          <p className="text-sm font-medium leading-normal pb-1.5 text-text-primary-light dark:text-text-primary-dark">End IP</p>
          <input className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 h-10 px-3 text-sm font-normal text-text-primary-light dark:text-text-primary-dark placeholder:text-text-secondary-light dark:placeholder:text-text-secondary-dark" placeholder="192.168.40.255" defaultValue="192.168.40.255" />
        </label>
        <label className="flex w-full flex-col">
          <p className="text-sm font-medium leading-normal pb-1.5 text-text-primary-light dark:text-text-primary-dark">Timeout (ms)</p>
          <input className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 h-10 px-3 text-sm font-normal text-text-primary-light dark:text-text-primary-dark placeholder:text-text-secondary-light dark:placeholder:text-text-secondary-dark" placeholder="500" defaultValue="500" />
        </label>
      </div>
      <button onClick={handleScan} className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-wide hover:bg-primary/90 transition-colors">
        <span className="truncate">{scanning ? 'SCANNING...' : 'START SCAN'}</span>
      </button>
      {scanning && (
        <div className="px-2 pt-1">
          <p className="text-xs text-center text-text-secondary-light dark:text-text-secondary-dark">Scanning 192.168.40.55...</p>
          <div className="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${progress}%` }}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScannerControl;
