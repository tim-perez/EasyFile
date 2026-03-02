export default function ActionWidget() {
  return (
    <div className="bg-[#282828] border border-gray-700 rounded-lg p-6 flex flex-col items-center justify-center text-center h-112">
      <div className="w-40 h-40 mb-6 flex items-center justify-center">
        <div className="text-6xl">📁</div>
      </div>
      <p className="text-gray-400 mb-6 text-sm px-4">
        Want to submit an expert review? <br/>
        Place an order to get started.
      </p>
      <button className="bg-white text-black px-6 py-2 rounded-full font-medium hover:bg-gray-200 transition">
        Place an Order
      </button>
    </div>
  );
}