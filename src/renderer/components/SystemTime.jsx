import React from 'react';

const SystemTime = ({ onSendCommand }) => {

  const handleSetTime = () => {
    const nowUnix = Math.floor(Date.now() / 1000);
    onSendCommand(`SET_TIME:${nowUnix}`);
  };

  const handleResetErrors = () => {
    onSendCommand('RESET_ERRORS');
  };

  return (
    <div className="flex flex-col rounded-lg border border-border-light dark:border-border-dark bg-panel-light dark:bg-panel-dark">
      <h3 className="px-4 py-3 text-base font-bold border-b border-border-light dark:border-border-dark">System &amp; Time</h3>
      <div className="flex items-center gap-3 p-4">
        <button onClick={handleSetTime} className="w-full bg-primary/20 dark:bg-primary/20 text-primary dark:text-sky-300 text-sm font-medium h-9 rounded-md hover:bg-primary/30 dark:hover:bg-primary/40">SET TIME</button>
        <button onClick={handleResetErrors} className="w-full bg-primary/20 dark:bg-primary/20 text-primary dark:text-sky-300 text-sm font-medium h-9 rounded-md hover:bg-primary/30 dark:hover:bg-primary/40">RESET ERRORS</button>
      </div>
    </div>
  );
};

export default SystemTime;
