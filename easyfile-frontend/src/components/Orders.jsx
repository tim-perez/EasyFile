export default function Orders() {
  return (
    <main className="flex-1 p-8 overflow-y-auto bg-[#1f1f1f] text-white">
      <h1 className="text-2xl font-bold mb-6">Account orders</h1>
      
      {/* Tabs */}
      <div className="flex space-x-6 border-b border-gray-700 mb-4">
        <button className="pb-2 border-b-2 border-white font-medium">Pending</button>
        <button className="pb-2 text-gray-400 hover:text-white transition">Executed</button>
        <button className="pb-2 text-gray-400 hover:text-white transition">Closed</button>
      </div>

      {/* Filter */}
      <div className="flex items-center space-x-3 mb-4 text-sm text-gray-400">
        <span className="text-lg">≡</span>
        <input 
          type="text" 
          placeholder="Filter" 
          className="bg-transparent border-none outline-none text-white w-full max-w-sm"
        />
      </div>

      {/* Table Header */}
      <div className="grid grid-cols-4 gap-4 pb-2 border-b border-gray-700 text-sm font-medium text-gray-400 mb-16">
        <div>Order</div>
        <div>Type</div>
        <div>Case</div>
        <div>Date ↓</div>
      </div>

      {/* Empty State */}
      <div className="flex flex-col items-center justify-center text-center mt-12">
        <div className="w-48 h-48 mb-6 flex items-center justify-center opacity-80">
          <div className="text-8xl">🗂️</div>
        </div>
        <p className="text-gray-400 mb-6 text-sm">No content available</p>
        <button className="bg-white text-black px-6 py-2 rounded-full font-medium hover:bg-gray-200 transition">
          Place an Order
        </button>
      </div>
    </main>
  );
}