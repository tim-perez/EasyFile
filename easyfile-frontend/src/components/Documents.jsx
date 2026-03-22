import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../services/api';
import DocumentReportModal from '../components/DocumentReportModal'; 

export default function Documents() {
  const { onOpenUploadModal } = useOutletContext();
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedIds, setSelectedIds] = useState([]);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedReportDocument, setSelectedReportDocument] = useState(null);

  useEffect(() => {
    fetchDocuments();
    window.addEventListener('documentUploaded', fetchDocuments);
    return () => {
      window.removeEventListener('documentUploaded', fetchDocuments);
    };
  }, []);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/documents'); 
      setDocuments(response.data);
      // Clear selections when data refreshes
      setSelectedIds([]); 
    } catch (err) {
      console.error("Error fetching documents:", err);
      setError("Failed to load documents.");
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // CHECKBOX LOGIC
  // ==========================================
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(documents.map(doc => doc.id)); // Select All
    } else {
      setSelectedIds([]); // Deselect All
    }
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) 
        ? prev.filter(itemId => itemId !== id) // Remove if already checked
        : [...prev, id] // Add if not checked
    );
  };

  // ==========================================
  // DELETE LOGIC
  // ==========================================
  const handleDeleteDocument = async (documentId) => {
    const isConfirmed = window.confirm("Move this document to the Recycle Bin?");
    if (!isConfirmed) return;

    try {
      await api.delete(`/documents/${documentId}`);
      fetchDocuments(); // Refresh the table so it disappears!
    } catch (error) {
      console.error("Failed to delete document:", error);
      alert("Error deleting document. Please try again.");
    }
  };

  const handleBulkDelete = async () => {
    const isConfirmed = window.confirm(`Move ${selectedIds.length} documents to the Recycle Bin?`);
    if (!isConfirmed) return;

    try {
      // Loop through all selected IDs and soft-delete them
      await Promise.all(selectedIds.map(id => api.delete(`/documents/${id}`)));
      fetchDocuments(); 
    } catch (error) {
      console.error("Failed to bulk delete:", error);
      alert("Error moving documents. Please try again.");
    }
  };

  const handleOpenDocument = async (documentId) => {
    try {
      const response = await api.get(`/documents/${documentId}/url`);
      if (response.data?.url) window.open(response.data.url, '_blank');
    } catch (error) {
      console.error("Failed to open document", error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getStatusBadge = (status) => {
    const currentStatus = status || 'Processed';
    if (currentStatus.toLowerCase() === 'incomplete') {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-500 border border-yellow-200 dark:border-yellow-800/50">
          Incomplete
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800/50">
        {currentStatus}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto w-full relative">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Documents</h1>

      {/* NEW: SMOOTH ANIMATED ACTION BAR */}
      {/* This uses max-height and opacity to slide open exactly like YouTube Studio */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${selectedIds.length > 0 ? 'max-h-16 opacity-100 mb-4' : 'max-h-0 opacity-0 mb-0'}`}>
        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 shadow-sm rounded-lg px-4 py-3 flex items-center justify-between">
          
          {/* Left Side: X Selected & Fake Dropdowns */}
          <div className="flex items-center gap-6">
            <span className="text-sm font-semibold text-gray-900 dark:text-white border-r border-gray-300 dark:border-gray-700 pr-6">
              {selectedIds.length} selected
            </span>
            
            <button className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1 hover:text-gray-900 dark:hover:text-white transition">
              Edit
              <svg className="w-4 h-4 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            
            <button className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-1 hover:text-gray-900 dark:hover:text-white transition">
              More actions
              <svg className="w-4 h-4 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
          </div>

          {/* Right Side: Bulk Move to Recycle Bin */}
          <button onClick={handleBulkDelete} className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            Move to Recycle Bin
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 px-2">
        <button className="flex items-center text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
          Filter
        </button>
      </div>

      <div className="bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-275">
            
            <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1a1a] text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <div className="col-span-1 flex items-center justify-center">
                {/* HEADER CHECKBOX */}
                <input 
                  type="checkbox" 
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-transparent cursor-pointer" 
                  checked={documents.length > 0 && selectedIds.length === documents.length}
                  onChange={handleSelectAll}
                />
              </div>
              <div className="col-span-2">File Name</div>
              <div className="col-span-2">AI Document Title</div>
              <div className="col-span-2">Case Number</div>
              <div className="col-span-1">County</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-1">Date</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {isLoading && (
              <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
            )}

            {/* UPDATED: VISUAL EMPTY STATE WITH ACTION */}
            {!isLoading && !error && documents.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 px-6 text-center border-2 border-dashed border-gray-100 dark:border-gray-800/50 rounded-lg mx-6 my-10 bg-gray-50 dark:bg-[#1a1a1a]">
                
                {/* 1. Sleek SVG Illustration (Matches the app's style) */}
                <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-8 border-4 border-white dark:border-[#1f1f1f] shadow-lg">
                    <svg className="w-12 h-12 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                </div>
                
                {/* 2. Primary Text */}
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No documents available</h3>
                
                {/* 3. Helper Text */}
                <p className="text-gray-500 dark:text-gray-400 mb-10 text-sm max-w-sm">
                  Your legal document vault is currently empty. Upload your first case filing or contract to begin the AI analysis.
                </p>

                {/* 4. The Action Button */}
                <button 
                  onClick={onOpenUploadModal} 
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors text-sm uppercase tracking-wider flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  Upload Documents
                </button>
              </div>
            )}

            {!isLoading && !error && documents.length > 0 && (
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {documents.map((doc) => (
                  <div key={doc.id} className={`grid grid-cols-12 gap-4 px-6 py-4 items-center transition-colors group ${selectedIds.includes(doc.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-gray-50 dark:hover:bg-[#282828]'}`}>
                    
                    <div className="col-span-1 flex items-center justify-center">
                      {/* INDIVIDUAL ROW CHECKBOX */}
                      <input 
                        type="checkbox" 
                        className={`rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-transparent cursor-pointer transition-opacity ${selectedIds.includes(doc.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}
                        checked={selectedIds.includes(doc.id)}
                        onChange={() => handleSelectOne(doc.id)}
                      />
                    </div>

                    <div className="col-span-2 flex flex-col pr-4 overflow-hidden">
                      <button onClick={() => handleOpenDocument(doc.id)} className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 truncate text-left w-full block transition-colors" title={doc.fileName || doc.FileName || 'Unknown File'}>
                        {doc.fileName || doc.FileName || 'Unknown File'}
                      </button>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate w-full block">PDF Document</span>
                    </div>

                    <div className="col-span-2 flex items-center pr-2 overflow-hidden">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate w-full block" title={doc.documentTitle || doc.DocumentTitle}>{doc.documentTitle || doc.DocumentTitle || 'Processing...'}</span>
                    </div>

                    <div className="col-span-2 flex items-center pr-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-mono bg-gray-100 dark:bg-[#2a2a2a] px-2 py-1 rounded truncate">{doc.caseNumber || doc.CaseNumber || 'Missing'}</span>
                    </div>

                    <div className="col-span-1 flex items-center pr-2">
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{doc.county || doc.County || 'Los Angeles'}</span>
                    </div>

                    <div className="col-span-1 flex items-center">{getStatusBadge(doc.status || doc.Status)}</div>

                    <div className="col-span-1 flex flex-col">
                      <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">{formatDate(doc.createdAt || doc.CreatedAt || doc.uploadDate || new Date())}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Uploaded</span>
                    </div>

                    <div className="col-span-2 flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setSelectedReportDocument(doc);
                          setIsReportModalOpen(true);
                        }}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium whitespace-nowrap"
                      >
                        View Report
                      </button>
                      <button onClick={() => handleDeleteDocument(doc.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20" title="Move to Recycle Bin">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
            
          </div>
        </div>
      </div>
      {/* NEW: The Document Report Modal */}
      <DocumentReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
        document={selectedReportDocument} 
      />
    </div>
  );
}

// import { useState, useEffect } from 'react';
// import UploadDocumentModal from './UploadDocumentModal';
// import ReviewModal from './ReviewModal';

// export default function Documents() {
//   const [documents, setDocuments] = useState([]);
//   const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
//   const [selectedDocument, setSelectedDocument] = useState([]);
//   const [viewingReport, setViewingReport] = useState(null);

//   const toggleSelection = (id) => {
//     if (selectedDocument.includes(id)) {
//       setSelectedDocument(selectedDocument.filter(existingId => existingId !== id));
//     } else {
//       setSelectedDocument([...selectedDocument, id]);
//     }
//   };

//   const handleDelete = async () => {
//     try {
//       const response = await fetch('/api/documents/recycle', {
//         method: 'DELETE',
//         headers: {
//           'Content-Type': 'application/json',
//         },
//         body: JSON.stringify(selectedDocument),
//       });

//       if (!response.ok) {
//         throw new Error('Failed to recycle documents');
//       }

//       const remainingDocuments = documents.filter((doc) => !selectedDocument.includes(doc.id));
//       setDocuments(remainingDocuments);
//       setSelectedDocument([]);

//     } catch (error) {
//       console.error('Error recycling documents:', error);
//     }
//   };

//   useEffect(() => {
//     const fetchDocuments = async () => {
//       try {
//         const response = await fetch('/api/documents');
//         if (response.ok) {
//           const data = await response.json();
//           setDocuments(data);
//         }
//       } catch (error) {
//         console.error("Error fetching documents:", error);
//       }
//     };

//     fetchDocuments();
//   }, []);



//   return (
//     <div className="p-8 text-white w-full h-full overflow-y-auto">
//       {/* 1. Title */}
//       <h1 className="text-2xl font-bold mb-6">Account Documents</h1>

//       {/* 3. Filter Placeholder & 4. Trash Can Placeholder */}
//       <div className="flex items-center space-x-4 mb-4 text-gray-400 border-b border-gray-700 pb-2">
//         <button className="hover:text-white">≡ Filter</button>
//         {/* We will add the logic to show the 🗑️ trash icon here later */}
//       </div>

//       {/* The Data Table */}
//       <div className="w-full border border-gray-700 rounded-md overflow-hidden">
//         <div className="mb-4">
//           {selectedDocument.length > 0 && (
//             <button className="text-red-500 hover:text-red-400 flex items-center gap-2" onClick={handleDelete}>
//               🗑️ Delete Selected
//             </button>
//           )}
//         </div>
//         <table className="w-full text-left text-sm text-gray-300">
//           <thead className="border-b border-gray-700 bg-[#1f1f1f]">
//             <tr>
//               <th className="p-4 w-12">
//                 <input type="checkbox" className="rounded bg-gray-800 border-gray-600" onClick={toggleSelection} />
//               </th>
//               <th className="p-4 font-medium">Document</th>
//               <th className="p-4 font-medium">Status</th>
//               <th className="p-4 font-medium">Reviewer</th>
//               <th className="p-4 font-medium">Date</th>
//               <th className="p-4 font-medium">Report</th>
//               <th className="p-4 font-medium">Review</th>
//             </tr>
//           </thead>
          
//           <tbody>
//             {documents.length === 0 ? (
//               <tr>
//                 <td colSpan="7" className="p-12">
//                   <div className="flex flex-col items-center justify-center text-gray-500 space-y-4">
//                     {/* 1. Placeholder Image */}
//                     <div className="w-32 h-32 bg-gray-700 rounded-md flex items-center justify-center">
//                       <span className="text-4xl">📄</span> {/* Replace with your actual image later */}
//                     </div>
                    
//                     {/* 2. Empty Text */}
//                     <p>No documents available</p>
                    
//                     {/* 3. Upload Button (via Modal Component) */}
//                     <UploadDocumentModal />
//                   </div>
//                 </td>
//               </tr>
//             ) : (
//               documents.map((doc) => (
//                 <tr key={doc.id} className="border-b border-gray-700 hover:bg-[#2a2a2a]">
//                   <td className="p-4"><input type="checkbox" className="rounded bg-gray-800 border-gray-600" onClick={() => toggleSelection(doc.id)} /></td>
//                   <td className="p-4">{doc.name}</td>
//                   <td className="p-4">{doc.status}</td>
//                   <td className="p-4">{doc.reviewer}</td>
//                   <td className="p-4">
//                     <div>{doc.date}</div>
//                     <div className="text-xs text-gray-500 mt-1">Uploaded</div>
//                   </td>
//                   <td className="p-4">
//                     {doc.aiReport ? (
//                       <button 
//                         onClick={() => setViewingReport(doc.aiReport)}
//                         className="text-blue-400 hover:text-blue-300 font-medium underline transition"
//                       >
//                         View Report
//                       </button>
//                     ) : (
//                       <span className="text-gray-600 italic">No Report</span>
//                     )}
//                   </td>
//                   <td className="p-4">
//                     <button className="text-blue-400 hover:underline" onClick={() => setIsReviewModalOpen(true)}>
//                       Leave a Review
//                     </button>
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>
      
//       {/* Keeping your modal here so it can be triggered */}
//       <UploadDocumentModal />
//       {isReviewModalOpen && (
//         <ReviewModal onClose={() => setIsReviewModalOpen(false)} />
//       )}

//       {/* NEW: The AI Report Modal */}
//       {viewingReport && (
//         <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
//           <div className="bg-[#1f1f1f] border border-gray-700 p-6 rounded-lg shadow-xl max-w-2xl w-full m-4">
//             <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-3">
//               <h2 className="text-xl font-bold text-white flex items-center gap-2">
//                 🤖 AI Document Analysis
//               </h2>
//               <button 
//                 onClick={() => setViewingReport(null)}
//                 className="text-gray-400 hover:text-white transition"
//               >
//                 ✕
//               </button>
//             </div>
            
//             {/* whitespace-pre-wrap ensures the AI's bullet points format correctly! */}
//             <div className="text-gray-300 whitespace-pre-wrap mb-6 max-h-96 overflow-y-auto leading-relaxed">
//               {viewingReport}
//             </div>
            
//             <div className="flex justify-end">
//               <button
//                 onClick={() => setViewingReport(null)}
//                 className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition"
//               >
//                 Close Report
//               </button>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }