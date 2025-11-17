import React, { useState } from 'react';
import { Search, List } from 'lucide-react';

// Per TechSpec 5.2, these are the *guaranteed* fields [cite: 217-227]
// We will format them. All other fields will be passed through.

// Helper to format telemetry keys into readable names
const formatStatName = (key) => {
  if (key === 'cpu_temp') return 'CPU Temperature';
  if (key === 'total_dist_travel') return 'Total Distance Traveled';
  if (key === 'max_speed') return 'Max Speed Setting';
  if (key === 'status_str') return 'Status String';
  if (key === 'batt') return 'Battery Charge';
  if (key === 'volt') return 'Battery Voltage';
  if (key === 'err') return 'Error Code';
  if (key === 'warn') return 'Warning Code';
  return key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

// Helper to format values
const formatStatValue = (key, value) => {
  if (value === null || value === undefined) return '...';
  if (key === 'cpu_temp') return `${value.toFixed(1)} °C`;
  if (key === 'total_dist_travel') return `${(value / 1000).toFixed(2)} km`;
  if (key === 'max_speed') return `${value} (raw)`;
  if (key === 'batt') return `${value}%`;
  if (key === 'volt') return `${value.toFixed(1)}V`;
  if (value === true) return 'True';
  if (value === false) return 'False';
  return value.toString();
};

// Helper to format the single timestamp
const formatTimestamp = (date) => {
  if (!date) return '...';
  return date.toLocaleTimeString();
};

const StatsViewer = ({ telemetry, lastUpdated, onViewChange }) => {
  const [filter, setFilter] = useState('');

  // Per TechSpec 5.2, the telemetry object is the source of truth.
  // We will display all keys it provides.
  const stats = telemetry ? Object.keys(telemetry) : [];

  const formattedTimestamp = formatTimestamp(lastUpdated);

  const filteredStats = stats
    .map(key => ({
      key: key,
      name: formatStatName(key),
      value: formatStatValue(key, telemetry[key]),
    }))
    .filter(stat => 
      stat.name.toLowerCase().includes(filter.toLowerCase()) || 
      stat.key.toLowerCase().includes(filter.toLowerCase())
    );

  return (
    <div className="flex flex-col w-full lg:w-[70%] bg-panel-light dark:bg-panel-dark rounded-lg border border-border-light dark:border-border-dark overflow-hidden">
      {/* Header with Toggle Button */}
      <div className="flex-shrink-0 p-4 border-b border-border-light dark:border-border-dark flex flex-wrap justify-between items-center gap-4">
        <h3 className="text-base font-bold leading-tight">Stats List</h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => onViewChange('logs')}
            className="flex items-center gap-2 whitespace-nowrap bg-background-light dark:bg-background-dark text-text-light-primary dark:text-text-dark-primary text-sm font-medium h-8 px-3 rounded-md border border-border-light dark:border-border-dark hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <List size={16} />
            <span>Log Screen</span>
          </button>
          <div className="relative w-full sm:w-auto">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light-secondary dark:text-text-dark-secondary" />
            <input 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full sm:w-64 rounded-md border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark py-1.5 pl-9 pr-3 text-sm focus:border-primary focus:ring-primary" 
              placeholder="Filter stats..." 
              type="text" 
            />
          </div>
        </div>
      </div>

      {/* Stats Table - NEW LAYOUT */}
      <div className="flex-1 overflow-y-auto">
        {!telemetry ? (
          <div className="p-4 text-center text-text-light-secondary dark:text-text-dark-secondary">
            Waiting for first telemetry packet...
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-panel-light dark:bg-panel-dark z-10">
              <tr>
                <th className="text-left font-semibold p-3 border-b border-border-light dark:border-border-dark w-1/3">Statistic</th>
                <th className="text-left font-semibold p-3 border-b border-border-light dark:border-border-dark w-1/3">Value</th>
                <th className="text-left font-semibold p-3 border-b border-border-light dark:border-border-dark w-1/3">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-light dark:divide-border-dark">
              {filteredStats.map((stat) => (
                <tr key={stat.key}>
                  <td className="p-3">{stat.name}</td>
                  <td className="p-3 font-medium">{stat.value}</td>
                  <td className="p-3 text-text-light-secondary dark:text-text-dark-secondary">
                    {formattedTimestamp}
                  </td>
                </tr>
              ))}
              {filteredStats.length === 0 && (
                <tr>
                  <td colSpan="3" className="p-4 text-center text-text-light-secondary dark:text-text-dark-secondary">
                    No stats match your filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default StatsViewer;