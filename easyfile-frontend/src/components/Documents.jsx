import { useState, useEffect } from 'react';
import UploadDocumentModal from './UploadDocumentModal';
import ReviewModal from './ReviewModal';

export default function Documents() {
  const [documents, setDocuments] = useState([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState([]);

  const toggleSelection = (id) => {
    if (selectedDocument.includes(id)) {
      setSelectedDocument(selectedDocument.filter(existingId => existingId !== id));
    } else {
      setSelectedDocument([...selectedDocument, id]);
    }
  };

  const handleDelete = () => {
    const remainingDocuments = documents.filter((doc) => !selectedDocument.includes(doc.id));
    setDocuments(remainingDocuments);
    setSelectedDocument([]);
  }

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        const response = await fetch('/api/documents');
        if (response.ok) {
          const data = await response.json();
          setDocuments(data);
        }
      } catch (error) {
        console.error("Error fetching documents:", error);
      }
    };

    fetchDocuments();
  }, []);



  return (
    <div className="p-8 text-white w-full h-full overflow-y-auto">
      {/* 1. Title */}
      <h1 className="text-2xl font-bold mb-6">Account Documents</h1>

      {/* 3. Filter Placeholder & 4. Trash Can Placeholder */}
      <div className="flex items-center space-x-4 mb-4 text-gray-400 border-b border-gray-700 pb-2">
        <button className="hover:text-white">≡ Filter</button>
        {/* We will add the logic to show the 🗑️ trash icon here later */}
      </div>

      {/* The Data Table */}
      <div className="w-full border border-gray-700 rounded-md overflow-hidden">
        <div className="mb-4">
          {selectedDocument.length > 0 && (
            <button className="text-red-500 hover:text-red-400 flex items-center gap-2" onClick={handleDelete}>
              🗑️ Delete Selected
            </button>
          )}
        </div>
        <table className="w-full text-left text-sm text-gray-300">
          <thead className="border-b border-gray-700 bg-[#1f1f1f]">
            <tr>
              <th className="p-4 w-12">
                <input type="checkbox" className="rounded bg-gray-800 border-gray-600" onClick={toggleSelection} />
              </th>
              <th className="p-4 font-medium">Document</th>
              <th className="p-4 font-medium">Status</th>
              <th className="p-4 font-medium">Reviewer</th>
              <th className="p-4 font-medium">Date</th>
              <th className="p-4 font-medium">Report</th>
              <th className="p-4 font-medium">Review</th>
            </tr>
          </thead>
          
          <tbody>
            {documents.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-12">
                  <div className="flex flex-col items-center justify-center text-gray-500 space-y-4">
                    {/* 1. Placeholder Image */}
                    <div className="w-32 h-32 bg-gray-700 rounded-md flex items-center justify-center">
                      <span className="text-4xl">📄</span> {/* Replace with your actual image later */}
                    </div>
                    
                    {/* 2. Empty Text */}
                    <p>No documents available</p>
                    
                    {/* 3. Upload Button (via Modal Component) */}
                    <UploadDocumentModal />
                  </div>
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id} className="border-b border-gray-700 hover:bg-[#2a2a2a]">
                  <td className="p-4"><input type="checkbox" className="rounded bg-gray-800 border-gray-600" onClick={() => toggleSelection(doc.id)} /></td>
                  <td className="p-4">{doc.name}</td>
                  <td className="p-4">{doc.status}</td>
                  <td className="p-4">{doc.reviewer}</td>
                  <td className="p-4">
                    <div>{doc.date}</div>
                    <div className="text-xs text-gray-500 mt-1">Uploaded</div>
                  </td>
                  <td className="p-4"><a href="#" className="text-blue-400 hover:underline" target="_blank" rel="noopener noreferrer">View</a></td>
                  <td className="p-4">
                    <button className="text-blue-400 hover:underline" onClick={() => setIsReviewModalOpen(true)}>
                      Leave a Review
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {/* Keeping your modal here so it can be triggered */}
      <UploadDocumentModal />
      {isReviewModalOpen && (
        <ReviewModal onClose={() => setIsReviewModalOpen(false)} />
      )}

    </div>
  );
}