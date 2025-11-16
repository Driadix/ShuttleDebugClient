import React from 'react';

const DeviceInfo = ({ details }) => {
  return (
    <div className="rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark">
      <div className="border-b border-border-light dark:border-border-dark p-4">
        <h3 className="text-lg font-semibold text-text-primary-light dark:text-text-primary-dark">Device Info</h3>
      </div>
      <div className="p-4">
        <dl className="space-y-3">
          <div className="flex justify-between text-sm">
            <dt className="text-text-secondary-light dark:text-text-secondary-dark">Firmware Version</dt>
            <dd className="font-mono text-text-primary-light dark:text-text-primary-dark">{details.firmware}</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-text-secondary-light dark:text-text-secondary-dark">MAC Address</dt>
            <dd className="font-mono text-text-primary-light dark:text-text-primary-dark">{details.mac}</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-text-secondary-light dark:text-text-secondary-dark">Uptime</dt>
            <dd className="font-mono text-text-primary-light dark:text-text-primary-dark">{details.uptime}</dd>
          </div>
          <div className="flex justify-between text-sm">
            <dt className="text-text-secondary-light dark:text-text-secondary-dark">Signal Strength</dt>
            <dd className="font-mono text-text-primary-light dark:text-text-primary-dark">{details.signal}</dd>
          </div>
        </dl>
      </div>
    </div>
  );
};

export default DeviceInfo;
