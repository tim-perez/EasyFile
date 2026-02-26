export default function AnalyticsWidget() {
  return (
    <div className="bg-[#282828] border border-gray-700 rounded-lg p-6 h-112">
      <h2 className="text-lg font-medium mb-2">Order analytics</h2>
      <p className="text-sm text-gray-400 mb-4">Current cycle</p>
      <div className="text-5xl font-light mb-6">0</div>
      
      <div className="border-t border-gray-700 py-4">
        <h3 className="text-sm font-medium mb-3">Summary</h3>
        <p className="text-xs text-gray-400 mb-2">Last 28 days</p>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-gray-300">Pending Orders</span>
          <span>0 <span className="text-gray-500">—</span></span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-300">Closed Orders</span>
          <span>0 <span className="text-gray-500">—</span></span>
        </div>
      </div>

      <div className="border-t border-gray-700 pt-4 mt-2">
        <button className="text-blue-400 text-sm font-medium hover:text-blue-300 uppercase tracking-wide">
          Go to order analytics
        </button>
      </div>
    </div>
  );
}