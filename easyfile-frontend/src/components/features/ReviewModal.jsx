import { useState } from 'react';

export default function ReviewModal({ onClose }) {
  const [stars, setStars] = useState(0);
  const [message, setMessage] = useState("");

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[#1f1f1f] border border-gray-700 p-6 rounded-md w-96 text-white">
        <h3 className="text-xl font-bold mb-4">Leave a Review</h3>
        
        {/* Star Selector */}
        <div className="flex space-x-2 mb-4">
          {[1, 2, 3, 4, 5].map((starValue) => (
            <button
              key={starValue}
              onClick={() => setStars(starValue)}
              className={`text-3xl ${starValue <= stars ? 'text-yellow-400' : 'text-gray-500'}`}
            >
              ★
            </button>
          ))}
        </div>

        {/* Message Box */}
        <textarea 
          className="w-full bg-[#121212] border border-gray-600 rounded p-2 mb-4 text-gray-300 focus:outline-none focus:border-blue-500"
          rows="4"
          placeholder="Leave an optional message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <button className="px-4 py-2 text-gray-400 hover:text-white" onClick={onClose}>
            Cancel
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Save
          </button>
        </div>
      </div>
    </div>
  );
}