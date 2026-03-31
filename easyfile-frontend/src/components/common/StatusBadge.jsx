import React from 'react';

export default function StatusBadge({ status }) {
  const currentStatus = status || 'Processed';
  if (currentStatus.toLowerCase() === 'incomplete') {
    return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-500 border border-yellow-200 dark:border-yellow-800/50">Incomplete</span>;
  }
  return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/50">{currentStatus}</span>;
}