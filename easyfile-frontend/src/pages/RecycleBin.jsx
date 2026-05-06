import React from 'react';
import { useDocuments } from '../hooks/useDocuments';
import api from '../services/api';
import SortableHeader from '../components/common/SortableHeader';

export default function RecycleBin() {
  const {
    documents: recycledSubmissions, originalDocuments, isLoading, error, fetchDocuments,
    selectedIds, handleSelectAll, handleSelectOne, sortConfig, handleSort
  } = useDocuments('/submissions/recycle');

  const handleRestore = async (id) => {
    try {
      await api.post(`/submissions/${id}/restore`);
      fetchDocuments();
      window.dispatchEvent(new Event('documentUploaded'));
    } catch (error) {
      alert(error.message || 'Failed to restore submission.');
    }
  };

  const handleBulkRestore = async () => {
    try {
      await Promise.all(selectedIds.map(id => api.post(`/submissions/${id}/restore`)));
      fetchDocuments();
      window.dispatchEvent(new Event('documentUploaded'));
    } catch (error) {
      alert(error.message || 'Failed to restore submissions.');
    }
  };

  const handlePermanentDelete = async (id) => {
    if (!window.confirm('Permanently delete this recycled submission content? This cannot be undone.')) return;
    try {
      await api.delete(`/submissions/${id}/permanent`);
      fetchDocuments();
    } catch (error) {
      alert(error.message || 'Failed to permanently delete submission.');
    }
  };

  const handleBulkPermanentDelete = async () => {
    if (!window.confirm(`Permanently delete ${selectedIds.length} recycled submission item(s)? This cannot be undone.`)) return;
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/submissions/${id}/permanent`)));
      fetchDocuments();
    } catch (error) {
      alert(error.message || 'Failed to permanently delete submissions.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown Date';
    return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const submissionNumber = (submission) => submission.submissionNumber || submission.SubmissionNumber || '0000';
  const deletedAt = (submission) => submission.deletedAt || submission.DeletedAt || submission.createdAt || submission.CreatedAt;

  return (
    <div className="w-full relative pb-12">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Recycle Bin</h1>

      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${selectedIds.length > 0 ? 'max-h-40 opacity-100 mb-4' : 'max-h-0 opacity-0 mb-0'}`}>
        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 shadow-sm rounded-lg px-4 py-3 flex flex-wrap items-center justify-between gap-4">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">{selectedIds.length} selected</span>
          <div className="flex items-center gap-4">
            <button onClick={handleBulkRestore} className="text-sm font-medium text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition flex items-center gap-1.5 whitespace-nowrap">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
              Restore
            </button>
            <button onClick={handleBulkPermanentDelete} className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition flex items-center gap-1.5 border-l border-gray-300 dark:border-gray-700 pl-4 whitespace-nowrap">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Delete Permanently
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <div className="w-full min-w-180">
            <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1a1a] text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <div className="col-span-1 flex items-center justify-center">
                <input type="checkbox" className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-transparent cursor-pointer" checked={recycledSubmissions.length > 0 && selectedIds.length === recycledSubmissions.length} onChange={(event) => handleSelectAll(event, recycledSubmissions)} />
              </div>
              <SortableHeader label="Submission #" sortKey="submissionNumber" colSpan={4} currentSort={sortConfig} onSort={handleSort} />
              <SortableHeader label="Date Deleted" sortKey="date" colSpan={4} currentSort={sortConfig} onSort={handleSort} />
              <div className="col-span-3 text-right">Actions</div>
            </div>

            {isLoading && <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}

            {!isLoading && error && <div className="px-6 py-8 text-sm text-red-600 dark:text-red-400">{error}</div>}

            {!isLoading && !error && recycledSubmissions.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-[#2a2a2a] rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{originalDocuments.length === 0 ? 'Recycle bin is empty.' : 'No recycled submissions match your filters.'}</p>
              </div>
            )}

            {!isLoading && !error && recycledSubmissions.length > 0 && (
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {recycledSubmissions.map(submission => (
                  <div key={submission.id} className={`grid grid-cols-12 gap-4 px-6 py-4 items-center transition-colors group ${selectedIds.includes(submission.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-gray-50 dark:hover:bg-[#282828]'}`}>
                    <div className="col-span-1 flex items-center justify-center">
                      <input type="checkbox" className={`rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-transparent cursor-pointer transition-opacity ${selectedIds.includes(submission.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} checked={selectedIds.includes(submission.id)} onChange={() => handleSelectOne(submission.id)} />
                    </div>

                    <div className="col-span-4">
                      <span className="text-sm font-mono font-semibold text-gray-900 dark:text-gray-100">#{submissionNumber(submission)}</span>
                      <span className="ml-3 text-xs text-gray-500 dark:text-gray-400">{submission.documentsUploaded ?? submission.DocumentsUploaded ?? 0} recycled document(s)</span>
                    </div>

                    <div className="col-span-4">
                      <span className="text-sm text-red-600 dark:text-red-400 whitespace-nowrap">{formatDate(deletedAt(submission))}</span>
                    </div>

                    <div className="col-span-3 flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleRestore(submission.id)} className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors p-1.5 rounded-md hover:bg-green-50 dark:hover:bg-green-900/20" title="Restore">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      </button>
                      <button onClick={() => handlePermanentDelete(submission.id)} className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1.5 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20" title="Delete Permanently">
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
    </div>
  );
}
