import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../services/api'; 
import UploadDocumentModal from '../features/UploadDocumentModal'; // Adjust path if needed
import DocumentReportModal from '../DocumentReportModal'; // Adjust path if needed

export default function ActionWidget() {
  const [recentDocuments, setRecentDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal States
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedReportDoc, setSelectedReportDoc] = useState(null);

  // Fetch the 5 most recent documents on load
  const fetchRecentDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await api.get('/documents');
      // The API already sorts by CreatedAt DESC, so we just slice the top 5!
      setRecentDocuments(response.data.slice(0, 5));
    } catch (error) {
      console.error("Failed to fetch recent documents:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecentDocuments();
  }, []);

  // Securely fetch the AWS URL and open the PDF in a new tab
  const handleViewDocument = async (id) => {
    try {
      const response = await api.get(`/documents/${id}/url`);
      window.open(response.data.url, '_blank');
    } catch (error) {
      console.error("Error fetching document URL:", error);
      alert("Could not load the document. Please try again.");
    }
  };

  return (
    // We use h-full to ensure it matches the height of the other widgets in the grid
    <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-2xl flex flex-col h-full min-h-100 shadow-sm overflow-hidden">
      
      {/* STATE 1: LOADING
      */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
           <svg className="animate-spin w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24">
             <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
             <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
           </svg>
        </div>
      ) : recentDocuments.length === 0 ? (
        /* STATE 2: EMPTY (No Documents) - Shows the giant call to action
        */
        <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
          <div className="w-32 h-32 mb-6 flex items-center justify-center bg-blue-50 dark:bg-blue-900/20 rounded-full">
            <svg className="w-16 h-16 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-sm px-4 leading-relaxed">
            Want to submit a document for expert review? <br/>
            Upload your legal files to get started.
          </p>
          <button 
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-full font-medium transition-colors shadow-sm flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
            Upload Document
          </button>
        </div>
      ) : (
        /* STATE 3: POPULATED (1 to 5 Documents) - Shows the recent list
        */
        <div className="flex-1 flex flex-col h-full">
          {/* Widget Header */}
          <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Uploads</h2>
            <button 
              onClick={() => setIsUploadModalOpen(true)}
              className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 p-2 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
              title="Upload New Document"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </button>
          </div>

          {/* Document List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {recentDocuments.map((doc) => (
              <div key={doc.id || doc.Id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-[#232323] hover:bg-gray-100 dark:hover:bg-[#2a2a2a] rounded-xl transition-colors border border-transparent hover:border-gray-200 dark:hover:border-gray-700">
                
                {/* File Icon & Secure Link */}
                <div className="flex items-center gap-3 overflow-hidden pr-4">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                  </div>
                  <button 
                    onClick={() => handleViewDocument(doc.id || doc.Id)}
                    className="text-sm font-medium text-gray-900 dark:text-gray-200 hover:text-blue-600 dark:hover:text-blue-400 truncate text-left transition-colors"
                    title={doc.fileName || doc.FileName}
                  >
                    {doc.fileName || doc.FileName}
                  </button>
                </div>

                {/* View Report Button */}
                <button 
                  onClick={() => {
                    setSelectedReportDoc(doc);
                    setIsReportModalOpen(true);
                  }}
                  className="shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                >
                  View Report
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- MODALS --- */}
      <UploadDocumentModal
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)} 
        onUploadSuccess={() => {
          setIsUploadModalOpen(false);
          fetchRecentDocuments(); // Instantly refresh the list after a successful upload!
        }} 
      />

      <DocumentReportModal 
        isOpen={isReportModalOpen} 
        onClose={() => setIsReportModalOpen(false)} 
        document={selectedReportDoc} 
      />

    </div>
  );
}