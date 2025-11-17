import React, { useState, useRef, useEffect } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { Save, Trash2, Search, X, BarChart2 } from 'lucide-react';

const LogLine = ({ log }) => {
  let color = 'text-text-light-primary dark:text-text-dark-primary';
  // Using includes for robustness
  if (log.includes('ERROR')) color = 'text-red-500';
  else if (log.includes('WARN')) color = 'text-yellow-500';
  else if (log.includes('INFO')) color = 'text-green-500';
  else if (log.includes('DEBUG')) color = 'text-blue-400';
  else if (log.includes('CMD')) color = 'text-purple-400';

  return <p className="whitespace-pre-wrap break-words">{log}</p>;
};

const LiveLogViewer = ({ logs, onSaveLog, onClearLogs, onViewChange }) => { 
  const [filter, setFilter] = useState('');
  const [autoscroll, setAutoscroll] = useState(true);
  const virtuoso = useRef(null);

  const filteredLogs = filter
    ? logs.filter(log => log.toLowerCase().includes(filter.toLowerCase()))
    : logs;

  useEffect(() => {
    if (autoscroll && virtuoso.current) {
      virtuoso.current.scrollToIndex({ index: filteredLogs.length - 1, align: 'end', behavior: 'smooth' });
    }
  }, [filteredLogs.length, autoscroll]); // Run when new logs arrive

  return (
    <div className="flex flex-col w-full lg:w-[70%] bg-panel-light dark:bg-panel-dark rounded-lg border border-border-light dark:border-border-dark overflow-hidden">
      {/* Header with Toggle Button */}
      <div className="flex-shrink-0 p-4 border-b border-border-light dark:border-border-dark flex flex-wrap justify-between items-center gap-4">
        <h3 className="text-base font-bold leading-tight">Live Log Viewer</h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onViewChange('stats')}
            className="flex items-center gap-2 whitespace-nowrap bg-background-light dark:bg-background-dark text-text-light-primary dark:text-text-dark-primary text-sm font-medium h-8 px-3 rounded-md border border-border-light dark:border-border-dark hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <BarChart2 size={16} />
            <span>Stats Screen</span>
          </button>
          <div className="relative w-full sm:w-auto">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light-secondary dark:text-text-dark-secondary" />
            <input 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full sm:w-64 rounded-md border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark py-1.5 pl-9 pr-8 text-sm focus:border-primary focus:ring-primary" 
              placeholder="Filter logs..." 
              type="text" 
            />
            {filter && (
              <button onClick={() => setFilter('')} className="absolute right-2 top-1/2 -translate-y-1/2">
                <X size={16} className="text-text-light-secondary dark:text-text-dark-secondary" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Log List */}
      <div className="flex-1 p-4 overflow-y-auto font-mono text-xs leading-relaxed">
        <Virtuoso
          ref={virtuoso}
          totalCount={filteredLogs.length}
          followOutput={autoscroll ? 'auto' : false}
          itemContent={index => <LogLine log={filteredLogs[index]} />}
          className="h-full w-full"
          style={{ height: '100%' }} // Virtuoso needs an explicit height
        />
      </div>

      {/* Footer Controls */}
      <div className="flex-shrink-0 flex flex-wrap items-center justify-between gap-4 p-2 border-t border-border-light dark:border-border-dark">
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer select-none px-3 py-1.5">
            <input 
              checked={autoscroll}
              onChange={(e) => setAutoscroll(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 bg-panel-light dark:bg-panel-dark text-primary focus:ring-primary focus:ring-offset-panel-light dark:focus:ring-offset-panel-dark" 
              type="checkbox" 
            />
            <span className="text-sm">Autoscroll</span>
          </label>
          <button onClick={onClearLogs} className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
            <Trash2 size={14} /> Clear Log
          </button>
          <button onClick={onSaveLog} className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-md hover:bg-gray-100 dark:hover:bg-gray-700">
            <Save size={14} /> Save Log
          </button>
        </div>
      </div>
    </div>
  );
};

export default LiveLogViewer;