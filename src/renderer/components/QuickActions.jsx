import React from 'react';

const QuickActions = ({ onSendCommand }) => {
  return (
    <div className="flex flex-col rounded-lg border border-border-light dark:border-border-dark bg-panel-light dark:bg-panel-dark">
      <h3 className="px-4 py-3 text-base font-bold border-b border-border-light dark:border-border-dark">Quick Actions</h3>
      <div className="grid grid-cols-3 gap-3 p-4">
        <button onClick={() => onSendCommand('STOP')} className="col-span-3 bg-red-600 text-white text-sm font-medium h-9 rounded-md hover:bg-red-700">STOP</button>
        <button onClick={() => onSendCommand('LOAD')} className="bg-primary/20 dark:bg-primary/20 text-primary dark:text-sky-300 text-sm font-medium h-9 rounded-md hover:bg-primary/30 dark:hover:bg-primary/40">LOAD</button>
        <button onClick={() => onSendCommand('UNLOAD')} className="bg-primary/20 dark:bg-primary/20 text-primary dark:text-sky-300 text-sm font-medium h-9 rounded-md hover:bg-primary/30 dark:hover:bg-primary/40">UNLOAD</button>
        <button onClick={() => onSendCommand('MANUAL')} className="bg-primary/20 dark:bg-primary/20 text-primary dark:text-sky-300 text-sm font-medium h-9 rounded-md hover:bg-primary/30 dark:hover:bg-primary/40">MANUAL</button>
      </div>
    </div>
  );
};

export default QuickActions;
