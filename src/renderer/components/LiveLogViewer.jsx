import React from 'react';

const LiveLogViewer = ({ logs }) => {
  return (
    <div className="flex flex-col w-full lg:w-[70%] bg-panel-light dark:bg-panel-dark rounded-lg border border-border-light dark:border-border-dark overflow-hidden">
      <div className="flex-shrink-0 p-4 border-b border-border-light dark:border-border-dark">
        <h3 className="text-base font-bold leading-tight">Live Log Viewer</h3>
      </div>
      <div className="flex-1 p-4 overflow-y-auto font-mono text-xs leading-relaxed">
        {logs && logs.map((log, index) => (
          <p key={index}>{log}</p>
        ))}
      </div>
      <div className="flex-shrink-0 flex flex-wrap items-center justify-between gap-4 p-2 border-t border-border-light dark:border-border-dark">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input defaultChecked className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 bg-panel-light dark:bg-panel-dark text-primary focus:ring-primary focus:ring-offset-panel-light dark:focus:ring-offset-panel-dark" type="checkbox" />
            <span className="text-sm">Autoscroll</span>
          </label>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
            <span className="material-symbols-outlined">delete</span> Clear Log
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
            <span className="material-symbols-outlined">save</span> Save Log
          </button>
        </div>
        <div className="relative w-full sm:w-auto">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-light-secondary dark:text-text-dark-secondary">search</span>
          <input className="w-full sm:w-64 rounded-md border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark py-1.5 pl-9 pr-3 text-sm focus:border-primary focus:ring-primary" placeholder="Filter..." type="text" />
        </div>
      </div>
    </div>
  );
};

export default LiveLogViewer;
