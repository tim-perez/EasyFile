import ActionWidget from './widgets/ActionWidget';
import AnalyticsWidget from './widgets/AnalyticsWidget';
import InformationWidgets from './widgets/InformationWidgets';

export default function DashboardLayout() {
  return (
    <div className="flex h-screen bg-[#282828] text-white font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-gray-700 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-700">
          <span className="text-xl font-bold text-red-500 tracking-wider">▶ EasyFile</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <a href="#" className="block px-4 py-2 rounded bg-gray-700 text-white font-medium">Dashboard</a>
          <a href="#" className="block px-4 py-2 rounded text-gray-400 hover:bg-gray-800 hover:text-white transition">Orders</a>
          <a href="#" className="block px-4 py-2 rounded text-gray-400 hover:bg-gray-800 hover:text-white transition">Cases</a>
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col">
        
        {/* Top Navigation */}
        <header className="h-16 shrink-0 border-b border-gray-700 flex items-center justify-between px-6 bg-[#282828]">
          <div className="flex-1 flex items-center">
            <input 
              type="text" 
              placeholder="Search across your workspace" 
              className="w-full max-w-xl bg-[#121212] border border-gray-600 rounded-full px-4 py-2 text-sm text-gray-300 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex items-center space-x-4 ml-4">
            <button className="text-gray-400 hover:text-white">Help</button>
            <button className="text-gray-400 hover:text-white">🔔</button>
            <button className="bg-white text-black px-4 py-1.5 rounded-full font-medium text-sm hover:bg-gray-200 transition">
              + Place an Order
            </button>
            <div className="w-8 h-8 rounded-full bg-gray-500 overflow-hidden border border-gray-600">
              <img src="https://ui-avatars.com/api/?name=Tim+Perez&background=random" alt="User Profile" />
            </div>
          </div>
        </header>

        {/* Dashboard Content Space */}
        <main className="flex-1 p-8 overflow-y-auto bg-[#1f1f1f]">
          <h1 className="text-2xl font-bold mb-6">EasyFile Dashboard</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <ActionWidget />
            <AnalyticsWidget />
            <InformationWidgets />
          </div>
        </main>
        
      </div>
    </div>
  );
}