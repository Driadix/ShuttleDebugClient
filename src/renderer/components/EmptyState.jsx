import React from 'react';
import { HardDriveDownload } from 'lucide-react';

const EmptyState = () => {
  return (
    <div className="flex h-full min-h-[600px] flex-col items-center justify-center text-center">
      <HardDriveDownload className="text-6xl text-text-secondary-light dark:text-text-secondary-dark opacity-50" />
      <h3 className="mt-4 text-xl font-semibold text-text-primary-light dark:text-text-primary-dark">No Hub Selected</h3>
      <p className="mt-1 text-text-secondary-light dark:text-text-secondary-dark">Select a hub from the list on the left to view its details.</p>
    </div>
  );
};

export default EmptyState;
