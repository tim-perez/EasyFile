import { Link, Outlet } from 'react-router-dom';

export default function DashboardLayout() {
  return (
    <div className="flex h-screen bg-[#282828] text-white font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-64 shrink-0 border-r border-gray-700 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-gray-700">
          <span className="text-xl font-bold text-red-500 tracking-wider">▶ EasyFile</span>
        </div>
        <nav className="flex-1 px-4 py-6 space-y-2">
          <Link to="/" className="block px-4 py-2 rounded hover:bg-gray-800 hover:text-white transition text-gray-400 focus:bg-gray-700 focus:text-white">Dashboard</Link>
          <Link to="/orders" className="block px-4 py-2 rounded hover:bg-gray-800 hover:text-white transition text-gray-400 focus:bg-gray-700 focus:text-white">Orders</Link>
          <Link to="/cases" className="block px-4 py-2 rounded text-gray-400 hover:bg-gray-800 hover:text-white transition focus:bg-gray-700 focus:text-white">Cases</Link>
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

        {/* Dynamic Content Space */}
        <Outlet />
        
      </div>
    </div>
  );
}