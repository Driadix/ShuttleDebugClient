import React from 'react';

const SystemTime = ({ onSendCommand, isDisabled }) => {

  const handleSetTime = () => {
    const nowUnix = Math.floor(Date.now() / 1000);
    onSendCommand(`SET_TIME:${nowUnix}`);
  };

  const handleResetErrors = () => {
    onSendCommand('RESET_ERRORS');
  };

  // Per TechSpec 6.1, adding Reboot button
  const handleReboot = () => {
    // This command key 'REBOOT' will be mapped by main.js using config.json
    onSendCommand('REBOOT');
  };

  return (
    <div className="flex flex-col rounded-lg border border-border-light dark:border-border-dark bg-panel-light dark:bg-panel-dark">
      <h3 className="px-4 py-3 text-base font-bold border-b border-border-light dark:border-border-dark">System &amp; Time</h3>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4">
        <button 
          onClick={handleSetTime} 
          disabled={isDisabled}
          className="w-full bg-primary/20 dark:bg-primary/20 text-primary dark:text-sky-300 text-sm font-medium h-9 rounded-md hover:bg-primary/30 dark:hover:bg-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          SET TIME
        </button>
        <button 
          onClick={handleResetErrors} 
          disabled={isDisabled}
          className="w-full bg-primary/20 dark:bg-primary/20 text-primary dark:text-sky-300 text-sm font-medium h-9 rounded-md hover:bg-primary/30 dark:hover:bg-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          RESET ERRORS
        </button>
        <button 
          onClick={handleReboot} 
          disabled={isDisabled}
          className="w-full bg-amber-500/20 text-amber-600 dark:text-amber-400 text-sm font-medium h-9 rounded-md hover:bg-amber-500/30 dark:hover:bg-amber-400/30 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          REBOOT
        </button>
      </div>
    </div>
  );
};

export default SystemTime;