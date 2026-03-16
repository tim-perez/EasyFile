import ActionWidget from './widgets/ActionWidget';
import AnalyticsWidget from './widgets/AnalyticsWidget';
import InformationWidgets from './widgets/InformationWidgets';

export default function AdminPortal() {
  return (
    <div className="p-6 bg-[#1f1f1f] min-h-full">
      <h1 className="text-2xl font-bold mb-6">Admin dashboard</h1>
      
      {/* 3-Column Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ActionWidget />
        <AnalyticsWidget />
        <InformationWidgets />
      </div>
    </div>
  );
}