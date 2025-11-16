import React from 'react';

const MovementConfig = () => {
  return (
    <div className="flex flex-col rounded-lg border border-border-light dark:border-border-dark bg-panel-light dark:bg-panel-dark">
      <h3 className="px-4 py-3 text-base font-bold border-b border-border-light dark:border-border-dark">Movement &amp; Config</h3>
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <label className="text-sm w-28 flex-shrink-0" htmlFor="max-speed">Max Speed</label>
          <input className="w-full rounded-md border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark py-1.5 px-3 text-sm focus:border-primary focus:ring-primary" id="max-speed" type="text" defaultValue="1.5" />
          <button className="bg-primary/20 dark:bg-primary/20 text-primary dark:text-sky-300 text-sm font-medium h-8 px-3 rounded-md hover:bg-primary/30 dark:hover:bg-primary/40">Set</button>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm w-28 flex-shrink-0" htmlFor="min-battery">Min Battery</label>
          <input className="w-full rounded-md border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark py-1.5 px-3 text-sm focus:border-primary focus:ring-primary" id="min-battery" type="text" defaultValue="20" />
          <button className="bg-primary/20 dark:bg-primary/20 text-primary dark:text-sky-300 text-sm font-medium h-8 px-3 rounded-md hover:bg-primary/30 dark:hover:bg-primary/40">Set</button>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm w-28 flex-shrink-0" htmlFor="move-fwd">Move Fwd (m)</label>
          <input className="w-full rounded-md border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark py-1.5 px-3 text-sm focus:border-primary focus:ring-primary" id="move-fwd" placeholder="meters" type="text" />
          <button className="bg-primary/20 dark:bg-primary/20 text-primary dark:text-sky-300 text-sm font-medium h-8 px-3 rounded-md hover:bg-primary/30 dark:hover:bg-primary/40">Go</button>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm w-28 flex-shrink-0" htmlFor="move-rev">Move Rev (m)</label>
          <input className="w-full rounded-md border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark py-1.5 px-3 text-sm focus:border-primary focus:ring-primary" id="move-rev" placeholder="meters" type="text" />
          <button className="bg-primary/20 dark:bg-primary/20 text-primary dark:text-sky-300 text-sm font-medium h-8 px-3 rounded-md hover:bg-primary/30 dark:hover:bg-primary/40">Go</button>
        </div>
      </div>
    </div>
  );
};

export default MovementConfig;
