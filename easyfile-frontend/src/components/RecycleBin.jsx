import { useState, useEffect } from 'react';
import api from '../services/api';
// Keeping your ReviewModal import just in case you want to wire it back up later!
import ReviewModal from './ReviewModal'; 

export default function RecycleBin() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for Checkboxes
  const [selectedIds, setSelectedIds] = useState([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  useEffect(() => {
    fetchRecycledDocuments();
  }, []);

  const fetchRecycledDocuments = async () => {
    try {
      setIsLoading(true);
      // Calls the new specific Recycle Bin endpoint
      const response = await api.get('/documents/recycle'); 
      setDocuments(response.data);
      setSelectedIds([]); 
    } catch (err) {
      console.error("Error fetching recycled documents:", err);
      setError("Failed to load recycle bin.");
    } finally {
      setIsLoading(false);
    }
  };

  // ==========================================
  // CHECKBOX LOGIC
  // ==========================================
  const handleSelectAll = (e) => {
    if (e.target.checked) setSelectedIds(documents.map(doc => doc.id));
    else setSelectedIds([]);
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    );
  };

  // ==========================================
  // RESTORE & DELETE LOGIC
  // ==========================================
  const handleRestore = async (id) => {
    try {
      await api.post(`/documents/${id}/restore`);
      fetchRecycledDocuments();
      // Whisper to the main Documents tab to fetch the newly restored item!
      window.dispatchEvent(new Event('documentUploaded')); 
    } catch (error) {
      console.error("Failed to restore:", error);
    }
  };

  const handleBulkRestore = async () => {
    try {
      await Promise.all(selectedIds.map(id => api.post(`/documents/${id}/restore`)));
      fetchRecycledDocuments();
      window.dispatchEvent(new Event('documentUploaded'));
    } catch (error) {
      console.error("Failed to bulk restore:", error);
    }
  };

  const handlePermanentDelete = async (id) => {
    const isConfirmed = window.confirm("Permanently delete this document? This cannot be undone.");
    if (!isConfirmed) return;
    try {
      await api.delete(`/documents/${id}/permanent`);
      fetchRecycledDocuments();
    } catch (error) {
      console.error("Failed to permanently delete:", error);
    }
  };

  const handleBulkPermanentDelete = async () => {
    const isConfirmed = window.confirm(`Permanently delete ${selectedIds.length} documents? This cannot be undone.`);
    if (!isConfirmed) return;
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/documents/${id}/permanent`)));
      fetchRecycledDocuments();
    } catch (error) {
      console.error("Failed to bulk delete:", error);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="max-w-7xl mx-auto w-full relative">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Recycle Bin</h1>

      {/* SMOOTH ANIMATED ACTION BAR (Matches Documents.jsx exactly) */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${selectedIds.length > 0 ? 'max-h-16 opacity-100 mb-4' : 'max-h-0 opacity-0 mb-0'}`}>
        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 shadow-sm rounded-lg px-4 py-3 flex items-center justify-between">
          
          <div className="flex items-center gap-6">
            <span className="text-sm font-semibold text-gray-900 dark:text-white border-r border-gray-300 dark:border-gray-700 pr-6">
              {selectedIds.length} selected
            </span>
          </div>

          {/* Action Buttons: Restore & Hard Delete */}
          <div className="flex items-center gap-4">
            <button onClick={handleBulkRestore} className="text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Restore
            </button>
            <button onClick={handleBulkPermanentDelete} className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition flex items-center gap-1.5 border-l border-gray-300 dark:border-gray-700 pl-4">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Delete Permanently
            </button>
          </div>
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
                <input type="checkbox" className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-transparent cursor-pointer" checked={documents.length > 0 && selectedIds.length === documents.length} onChange={handleSelectAll} />
              </div>
              <div className="col-span-2">File Name</div>
              <div className="col-span-2">AI Document Title</div>
              <div className="col-span-2">Case #</div>
              <div className="col-span-1">County</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-1">Date</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {isLoading && (
              <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
            )}

            {!isLoading && !error && documents.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-[#2a2a2a] rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">Recycle bin is empty</p>
              </div>
            )}

            {!isLoading && !error && documents.length > 0 && (
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {documents.map((doc) => (
                  <div key={doc.id} className={`grid grid-cols-12 gap-4 px-6 py-4 items-center transition-colors group ${selectedIds.includes(doc.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-gray-50 dark:hover:bg-[#282828]'}`}>
                    
                    <div className="col-span-1 flex items-center justify-center">
                      <input type="checkbox" className={`rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-transparent cursor-pointer transition-opacity ${selectedIds.includes(doc.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} checked={selectedIds.includes(doc.id)} onChange={() => handleSelectOne(doc.id)} />
                    </div>

                    {/* Notice no hyperlink here! We don't want them opening a deleted document */}
                    <div className="col-span-2 flex flex-col pr-4 overflow-hidden opacity-60">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate w-full block" title={doc.fileName || doc.FileName}>
                        {doc.fileName || doc.FileName || 'Unknown File'}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate w-full block">PDF Document</span>
                    </div>

                    <div className="col-span-2 flex items-center pr-2 overflow-hidden opacity-60">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate w-full block">{doc.documentTitle || doc.DocumentTitle || 'Unknown'}</span>
                    </div>

                    <div className="col-span-2 flex items-center pr-2 opacity-60">
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-mono bg-gray-100 dark:bg-[#2a2a2a] px-2 py-1 rounded truncate">{doc.caseNumber || doc.CaseNumber || 'Missing'}</span>
                    </div>

                    <div className="col-span-1 flex items-center pr-2 opacity-60">
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{doc.county || doc.County || 'Los Angeles'}</span>
                    </div>

                    <div className="col-span-1 flex items-center opacity-60">
                       <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">Recycled</span>
                    </div>

                    <div className="col-span-1 flex flex-col">
                      <span className="text-sm text-red-600 dark:text-red-400 whitespace-nowrap">{formatDate(doc.deletedAt || doc.DeletedAt || new Date())}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Deleted</span>
                    </div>

                    <div className="col-span-2 flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Restore Button */}
                      <button onClick={() => handleRestore(doc.id)} className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors p-1.5 rounded-md hover:bg-green-50 dark:hover:bg-green-900/20" title="Restore Document">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      </button>
                      
                      {/* Permanent Delete Button */}
                      <button onClick={() => handlePermanentDelete(doc.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete Permanently">
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

      {isReviewModalOpen && <ReviewModal onClose={() => setIsReviewModalOpen(false)} />}
    </div>
  );
}