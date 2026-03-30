import ActionWidget from './widgets/ActionWidget';
import AnalyticsWidget from './widgets/AnalyticsWidget';
import InformationWidgets from './widgets/InformationWidgets';

export default function AdminPortal() {
  return (
    <div className="p-6 min-h-full w-full">
      {/* Added responsive text colors here to match the rest of the app */}
      <h1 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">Admin Dashboard</h1>
      
      {/* 3-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ActionWidget />
        <AnalyticsWidget />
        <InformationWidgets />
      </div>
    </div>
  );
}