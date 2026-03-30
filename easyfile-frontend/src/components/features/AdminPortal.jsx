import React from 'react';
import ActionWidget from './widgets/ActionWidget';
import AnalyticsWidget from './widgets/AnalyticsWidget';
import InformationWidgets from './widgets/InformationWidgets';

export default function AdminPortal() {
  return (
    <div className="max-w-7xl mx-auto min-h-full text-gray-900 dark:text-white">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ActionWidget />
        <AnalyticsWidget />
        <InformationWidgets />
      </div>
    </div>
  );
}