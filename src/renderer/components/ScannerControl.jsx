import React, { useState } from 'react';

const ScannerControl = ({ onScan, scanStatus }) => {
  const [startIp, setStartIp] = useState('192.168.40.1');
  const [endIp, setEndIp] = useState('192.168.40.255');
  const [timeout, setTimeout] = useState('500');

  const scanning = scanStatus.percent > 0 && scanStatus.percent < 100;

  const handleScan = () => {
    if (scanning) return; // Don't start a new scan
    onScan({ start: startIp, end: endIp, timeout: parseInt(timeout, 10) });
  };

  return (
    <div className="flex flex-col gap-4 border-b border-border-light dark:border-border-dark p-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-text-secondary-light dark:text-text-secondary-dark px-2">Scanner Control</h3>
      <div className="flex flex-col gap-3 px-2">
        <label className="flex w-full flex-col">
          <p className="text-sm font-medium leading-normal pb-1.5 text-text-primary-light dark:text-text-primary-dark">Start IP</p>
          <input value={startIp} onChange={(e) => setStartIp(e.target.value)} disabled={scanning} className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 h-10 px-3 text-sm font-normal text-text-primary-light dark:text-text-primary-dark placeholder:text-text-secondary-light dark:placeholder:text-text-secondary-dark disabled:opacity-50" />
        </label>
        <label className="flex w-full flex-col">
          <p className="text-sm font-medium leading-normal pb-1.5 text-text-primary-light dark:text-text-primary-dark">End IP</p>
          <input value={endIp} onChange={(e) => setEndIp(e.target.value)} disabled={scanning} className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 h-10 px-3 text-sm font-normal text-text-primary-light dark:text-text-primary-dark placeholder:text-text-secondary-light dark:placeholder:text-text-secondary-dark disabled:opacity-50" />
        </label>
        <label className="flex w-full flex-col">
          <p className="text-sm font-medium leading-normal pb-1.5 text-text-primary-light dark:text-text-primary-dark">Timeout (ms)</p>
          <input value={timeout} onChange={(e) => setTimeout(e.target.value)} disabled={scanning} className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg border border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark focus:outline-0 focus:ring-2 focus:ring-primary/50 h-10 px-3 text-sm font-normal text-text-primary-light dark:text-text-primary-dark placeholder:text-text-secondary-light dark:placeholder:text-text-secondary-dark disabled:opacity-50" />
        </label>
      </div>
      <button onClick={handleScan} disabled={scanning} className="flex min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 bg-primary text-white text-sm font-bold leading-normal tracking-wide hover:bg-primary/90 transition-colors disabled:opacity-50">
        <span className="truncate">{scanning ? 'SCANNING...' : 'START SCAN'}</span>
      </button>
      {scanning && (
        <div className="px-2 pt-1">
          <p className="text-xs text-center text-text-secondary-light dark:text-text-secondary-dark">Scanning {scanStatus.ip}...</p>
          <div className="mt-1 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
            <div className="bg-primary h-1.5 rounded-full" style={{ width: `${scanStatus.percent}%` }}></div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScannerControl;
