export default function InformationWidgets() {
  return (
    <div className="space-y-6">
      <div className="bg-[#282828] border border-gray-700 rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Tutorial: Place an Order</h2>
        <div className="aspect-video bg-black rounded mb-4 flex items-center justify-center relative overflow-hidden">
           <span className="text-gray-500 text-sm">▶ YouTube Video</span>
           <span className="absolute top-2 right-2 bg-white text-black text-[10px] font-bold px-1 rounded">EASYFILE INSIDER</span>
        </div>
        <h3 className="text-sm font-medium mb-2">How to Place an Order using EasyFile</h3>
        <p className="text-xs text-gray-400 mb-4 leading-relaxed">
          Hey team! We're covering the new streamlined process for placing orders and attaching supplementary files. Check it out!
        </p>
        <button className="text-sm font-medium bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-full transition">
          Watch on YouTube
        </button>
      </div>

      <div className="bg-[#282828] border border-gray-700 rounded-lg p-6">
        <h2 className="text-lg font-medium mb-4">Developer Connect</h2>
        <div className="space-y-4">
          <a href="#" className="block text-sm text-gray-300 hover:text-white border-b border-gray-700 pb-2">Portfolio Website</a>
          <a href="#" className="block text-sm text-gray-300 hover:text-white border-b border-gray-700 pb-2">LinkedIn Profile</a>
          <a href="#" className="block text-sm text-gray-300 hover:text-white">GitHub Repository</a>
        </div>
      </div>
    </div>
  );
}