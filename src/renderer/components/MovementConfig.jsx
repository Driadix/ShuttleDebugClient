import React, { useState } from 'react';

const MovementConfig = ({ onSendCommand, isDisabled }) => {
  const [maxSpeed, setMaxSpeed] = useState('150'); // ESP32 default
  const [minBattery, setMinBattery] = useState('20');
  const [moveFwd, setMoveFwd] = useState('');
  const [moveRev, setMoveRev] = useState('');

  const handleSetMaxSpeed = () => {
    onSendCommand(`SET_MAX_SPEED:${parseInt(maxSpeed, 10)}`);
  };

  const handleSetMinBattery = () => {
    onSendCommand(`SET_MIN_BATT:${parseInt(minBattery, 10)}`);
  };

  const handleMoveFwd = () => {
    const val = Math.round(parseFloat(moveFwd) * 10); // meters * 10
    if (val > 0) onSendCommand(`MOVE_FORWARD_DIST:${val}`);
    setMoveFwd('');
  };

  const handleMoveRev = () => {
    const val = Math.round(parseFloat(moveRev) * 10); // meters * 10
    if (val > 0) onSendCommand(`MOVE_REVERSE_DIST:${val}`);
    setMoveRev('');
  };

  return (
    <div className="flex flex-col rounded-lg border border-border-light dark:border-border-dark bg-panel-light dark:bg-panel-dark">
      <h3 className="px-4 py-3 text-base font-bold border-b border-border-light dark:border-border-dark">Movement &amp; Config</h3>
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <label className="text-sm w-28 flex-shrink-0" htmlFor="max-speed">Max Speed</label>
          <input 
            value={maxSpeed} 
            onChange={(e) => setMaxSpeed(e.target.value)} 
            disabled={isDisabled}
            className="w-full rounded-md border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark py-1.5 px-3 text-sm focus:border-primary focus:ring-primary disabled:opacity-50" 
            id="max-speed" 
            type="number" 
          />
          <button 
            onClick={handleSetMaxSpeed} 
            disabled={isDisabled}
            className="bg-primary/20 dark:bg-primary/20 text-primary dark:text-sky-300 text-sm font-medium h-8 px-3 rounded-md hover:bg-primary/30 dark:hover:bg-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Set
          </button>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm w-28 flex-shrink-0" htmlFor="min-battery">Min Battery %</label>
          <input 
            value={minBattery} 
            onChange={(e) => setMinBattery(e.target.value)} 
            disabled={isDisabled}
            className="w-full rounded-md border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark py-1.5 px-3 text-sm focus:border-primary focus:ring-primary disabled:opacity-50" 
            id="min-battery" 
            type="number" 
          />
          <button 
            onClick={handleSetMinBattery} 
            disabled={isDisabled}
            className="bg-primary/20 dark:bg-primary/20 text-primary dark:text-sky-300 text-sm font-medium h-8 px-3 rounded-md hover:bg-primary/30 dark:hover:bg-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Set
          </button>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm w-28 flex-shrink-0" htmlFor="move-fwd">Move Fwd (m)</label>
          <input 
            value={moveFwd} 
            onChange={(e) => setMoveFwd(e.target.value)} 
            disabled={isDisabled}
            className="w-full rounded-md border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark py-1.5 px-3 text-sm focus:border-primary focus:ring-primary disabled:opacity-50" 
            id="move-fwd" 
            placeholder="meters" 
            type="number" 
          />
          <button 
            onClick={handleMoveFwd} 
            disabled={isDisabled}
            className="bg-primary/20 dark:bg-primary/20 text-primary dark:text-sky-300 text-sm font-medium h-8 px-3 rounded-md hover:bg-primary/30 dark:hover:bg-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Go
          </button>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm w-28 flex-shrink-0" htmlFor="move-rev">Move Rev (m)</label>
          <input 
            value={moveRev} 
            onChange={(e) => setMoveRev(e.target.value)} 
            disabled={isDisabled}
            className="w-full rounded-md border-border-light dark:border-border-dark bg-background-light dark:bg-background-dark py-1.5 px-3 text-sm focus:border-primary focus:ring-primary disabled:opacity-50" 
            id="move-rev" 
            placeholder="meters" 
            type="number" 
          />
          <button 
            onClick={handleMoveRev} 
            disabled={isDisabled}
            className="bg-primary/20 dark:bg-primary/20 text-primary dark:text-sky-300 text-sm font-medium h-8 px-3 rounded-md hover:bg-primary/30 dark:hover:bg-primary/40 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Go
          </button>
        </div>
      </div>
    </div>
  );
};

export default MovementConfig;