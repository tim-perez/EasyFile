import React from 'react';

export default function SortableHeader({ label, sortKey, currentSort, onSort, colSpan = 1 }) {
  return (
    <div 
      className={`col-span-${colSpan} flex items-center cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors select-none`} 
      onClick={() => onSort(sortKey)}
    >
      {label}
      <span className="ml-1 text-[10px] text-gray-400">
        {currentSort.key === sortKey ? (currentSort.direction === 'asc' ? '▲' : '▼') : '↕'}
      </span>
    </div>
  );
}