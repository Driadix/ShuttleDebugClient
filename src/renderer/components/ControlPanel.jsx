import React from 'react';
import { RefreshCw, Download, Terminal } from 'lucide-react';

const ControlPanel = () => {
  return (
    <div className="rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
      <div className="border-b border-border-light dark:border-border-dark p-4">
        <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">Control Panel</h3>
      </div>
      <div className="grid grid-cols-2 gap-4 p-4">
        <button className="flex items-center justify-center gap-2 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary h-12 text-sm font-semibold hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors">
          <RefreshCw size={16} />
          <span>Reboot Hub</span>
        </button>
        <button className="flex items-center justify-center gap-2 rounded-lg bg-primary/10 dark:bg-primary/20 text-primary h-12 text-sm font-semibold hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors">
          <Download size={16} />
          <span>Update Firmware</span>
        </button>
        <button className="flex items-center justify-center gap-2 rounded-lg col-span-2 bg-primary/10 dark:bg-primary/20 text-primary h-12 text-sm font-semibold hover:bg-primary/20 dark:hover:bg-primary/30 transition-colors">
          <Terminal size={16} />
          <span>Send Command</span>
        </button>
      </div>
    </div>
  );
};

export default ControlPanel;
