import React from 'react';
import DeviceInfo from './DeviceInfo';
import ControlPanel from './ControlPanel';
import RealtimeLogs from './RealtimeLogs';

const MainContent = ({ hub }) => {
  return (
    <>
      <header className="mb-8">
        <h2 className="text-3xl font-bold leading-tight tracking-tight text-text-primary-light dark:text-text-primary-dark">{hub.name}</h2>
        <p className="text-text-secondary-light dark:text-text-secondary-dark mt-1">Detailed hub information and controls</p>
      </header>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DeviceInfo details={hub.details} />
        <ControlPanel />
      </div>
      <RealtimeLogs />
    </>
  );
};

export default MainContent;
