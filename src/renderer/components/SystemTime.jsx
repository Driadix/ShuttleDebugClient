import React from 'react';

const SystemTime = () => {
  return (
    <div className="flex flex-col rounded-lg border border-border-light dark:border-border-dark bg-panel-light dark:bg-panel-dark">
      <h3 className="px-4 py-3 text-base font-bold border-b border-border-light dark:border-border-dark">System &amp; Time</h3>
      <div className="flex items-center gap-3 p-4">
        <button className="w-full bg-primary/20 dark:bg-primary/20 text-primary dark:text-sky-300 text-sm font-medium h-9 rounded-md hover:bg-primary/30 dark:hover:bg-primary/40">SET TIME</button>
        <button className="w-full bg-primary/20 dark:bg-primary/20 text-primary dark:text-sky-300 text-sm font-medium h-9 rounded-md hover:bg-primary/30 dark:hover:bg-primary/40">RESET ERRORS</button>
      </div>
    </div>
  );
};

export default SystemTime;
