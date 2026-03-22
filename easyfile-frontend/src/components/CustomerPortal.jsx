import ActionWidget from './widgets/ActionWidget';
import AnalyticsWidget from './widgets/AnalyticsWidget';
import InformationWidgets from './widgets/InformationWidgets';

export default function CustomerPortal() {
  return (
    <div className="min-h-full p-6 lg:p-8 text-gray-900 dark:text-white">
      <h1 className="text-2xl font-bold mb-8">Dashboard</h1>
      
      {/* 3-Column Grid Layout - Matches YouTube Studio exactly */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ActionWidget />
        <AnalyticsWidget />
        <InformationWidgets />
      </div>
    </div>
  );
}