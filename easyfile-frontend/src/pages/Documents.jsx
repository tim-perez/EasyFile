import React, { useState, useEffect } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthProvider';
import { useDocuments } from '../hooks/useDocuments';
import api from '../services/api';

import SortableHeader from '../components/common/SortableHeader';
import StatusBadge from '../components/common/StatusBadge';
import DocumentReportModal from '../components/features/DocumentReportModal'; 
import EditDocumentModal from '../components/features/EditDocumentModal'; 

export default function Documents() {
  const { user } = useAuth();
  const { onOpenUploadModal } = useOutletContext();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const {
    documents, originalDocuments, totalCount, totalPages, pageNumber, setPageNumber, 
    isLoading, error, fetchDocuments, selectedIds, handleSelectAll, handleSelectOne, 
    sortConfig, handleSort, activeFilters, setActiveFilters, uniqueOptions, setSearchQuery
  } = useDocuments();

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [selectedReportDocument, setSelectedReportDocument] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  
  const [userDictionary, setUserDictionary] = useState({});
  const [activePopoverId, setActivePopoverId] = useState(null);

  const globalSearchQuery = searchParams.get('q') || '';

  useEffect(() => {
    setSearchQuery(globalSearchQuery);
  }, [globalSearchQuery, setSearchQuery]);

  useEffect(() => {
    if (user?.role === 'Admin') {
      api.get('/users/all?pageNumber=1&pageSize=1000').then(res => {
        const dictionary = {};
        const usersList = res.data.items || res.data;
        usersList.forEach(u => dictionary[u.id] = u);
        setUserDictionary(dictionary);
      }).catch(err => console.error("Failed to load user dictionary", err));
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = () => setActivePopoverId(null);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleBulkDelete = async () => {
    if (!window.confirm(`Move ${selectedIds.length} documents to the Recycle Bin?`)) return;
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/documents/${id}`)));
      fetchDocuments(); 
    } catch (err) {
      console.error("Failed to bulk delete:", err);
      alert("Error moving documents.");
    }
  };

  const handleDownloadAllReports = async () => {
    try {
      const response = await api.post('/documents/bulk-download/reports', { documentIds: selectedIds }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'EasyFile_Reports.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download reports:", err);
      alert("Failed to generate zip file.");
    }
  };

  const handleDownloadAllFiles = async () => {
    try {
      const response = await api.post('/documents/bulk-download/files', { documentIds: selectedIds }, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'EasyFile_Originals.zip');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Failed to download original files:", err);
      alert("Failed to download files.");
    }
  };

  const handleOpenDocument = async (documentId) => {
    try {
      const response = await api.get(`/documents/${documentId}/url`);
      if (response.data?.url) window.open(response.data.url, '_blank');
    } catch (err) {
      console.error("Failed to open document", err);
    }
  };

  const handleDeleteDocument = async (documentId) => {
    if (!window.confirm("Move this document to the Recycle Bin?")) return;
    try {
      await api.delete(`/documents/${documentId}`);
      fetchDocuments();
    } catch (err) {
      console.error("Failed to delete document:", err);
      alert("Error deleting document.");
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown Date';
    return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const selectedDocumentObjects = originalDocuments.filter(doc => selectedIds.includes(doc.id));
  const activeFilterCount = Object.values(activeFilters).filter(val => val !== '').length;

  return (
    <div className="w-full relative pb-12">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Documents</h1>

      {error && (
        <div className="mb-4 p-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg dark:bg-red-900/30 dark:text-red-400 dark:border-red-800">
          {error}
        </div>
      )}

      {/* SMOOTH ANIMATED ACTION BAR */}
      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${selectedIds.length > 0 ? 'max-h-40 opacity-100 mb-4' : 'max-h-0 opacity-0 mb-0'}`}>
        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 shadow-sm rounded-lg px-4 py-3 flex flex-wrap lg:flex-nowrap items-center justify-between gap-4">
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg border border-blue-100 dark:border-blue-800 w-full lg:w-auto">
            <span className="text-sm font-medium text-blue-700 dark:text-blue-400 whitespace-nowrap">{selectedIds.length || 0} selected</span>
            <div className="hidden sm:block h-4 w-px bg-blue-200 dark:bg-blue-700"></div>
            <button onClick={() => setIsEditModalOpen(true)} className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors whitespace-nowrap">Edit</button>
            <select onChange={(e) => {
              if (e.target.value === 'reports') handleDownloadAllReports();
              if (e.target.value === 'files') handleDownloadAllFiles();
              e.target.value = '';
            }} className="text-sm bg-transparent font-medium text-gray-700 dark:text-gray-300 cursor-pointer outline-none hover:text-blue-600 dark:hover:text-blue-400 w-full sm:w-auto truncate" defaultValue="">
              <option value="" disabled>More Actions...</option>
              <option value="reports">Download All Reports</option>
              <option value="files">Download All Original Files</option>
            </select>
          </div>
          {user?.role !== 'Guest' && (
            <button onClick={handleBulkDelete} className="text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition flex items-center justify-center lg:justify-end gap-2 whitespace-nowrap w-full lg:w-auto lg:ml-auto">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              Move to Recycle Bin
            </button>
          )}
        </div>
      </div>

      {/* FILTER BUTTON & ACTIVE SEARCH BADGE */}
      <div className="mb-4 px-2 relative flex flex-wrap items-center gap-3 z-20">
        <button onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)} className={`flex items-center text-sm font-medium transition px-3 py-1.5 rounded-md ${isFilterMenuOpen || activeFilterCount > 0 ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'}`}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
          Filter {activeFilterCount > 0 && `(${activeFilterCount})`}
        </button>

        {globalSearchQuery && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-md text-sm font-medium border border-blue-200 dark:border-blue-800">
            <span>Search: "{globalSearchQuery}"</span>
            <button onClick={() => { const params = new URLSearchParams(searchParams); params.delete('q'); setSearchParams(params); }} className="p-0.5 hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        )}

        {isFilterMenuOpen && (
          <div className="absolute top-full left-0 mt-2 w-full max-w-4xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 shadow-xl rounded-xl p-4 z-50">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">AI Document Title</label>
                <select value={activeFilters.documentTitle} onChange={(e) => setActiveFilters({ ...activeFilters, documentTitle: e.target.value })} className="w-full bg-gray-50 dark:bg-[#151515] border border-gray-200 dark:border-gray-700 rounded-lg text-sm p-2 outline-none focus:border-blue-500 dark:text-white">
                  <option value="">All Titles</option>
                  {uniqueOptions.titles.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Case Number</label>
                <select value={activeFilters.caseNumber} onChange={(e) => setActiveFilters({ ...activeFilters, caseNumber: e.target.value })} className="w-full bg-gray-50 dark:bg-[#151515] border border-gray-200 dark:border-gray-700 rounded-lg text-sm p-2 outline-none focus:border-blue-500 dark:text-white">
                  <option value="">All Cases</option>
                  {uniqueOptions.cases.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">County</label>
                <select value={activeFilters.county} onChange={(e) => setActiveFilters({ ...activeFilters, county: e.target.value })} className="w-full bg-gray-50 dark:bg-[#151515] border border-gray-200 dark:border-gray-700 rounded-lg text-sm p-2 outline-none focus:border-blue-500 dark:text-white">
                  <option value="">All Counties</option>
                  {uniqueOptions.counties.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Status</label>
                <select value={activeFilters.status} onChange={(e) => setActiveFilters({ ...activeFilters, status: e.target.value })} className="w-full bg-gray-50 dark:bg-[#151515] border border-gray-200 dark:border-gray-700 rounded-lg text-sm p-2 outline-none focus:border-blue-500 dark:text-white">
                  <option value="">All Statuses</option>
                  {uniqueOptions.statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <button onClick={() => setActiveFilters({ documentTitle: '', caseNumber: '', county: '', status: '' })} className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition">Clear All Filters</button>
            </div>
          </div>
        )}
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
      ) : documents.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center border border-dashed border-gray-300 dark:border-gray-700 rounded-xl bg-gray-50 dark:bg-[#1a1a1a]">
          <div className="w-24 h-24 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-8 shadow-sm">
              <svg className="w-12 h-12 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No documents found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-8 text-sm max-w-sm">No documents match your current filter settings.</p>
          {originalDocuments.length === 0 && (
            <button onClick={onOpenUploadModal} className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg shadow-sm transition-colors text-sm uppercase tracking-wider flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              Upload Documents
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <div className="w-full min-w-300">
              
              {/* TABLE HEADER */}
              <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1a1a] text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <div className="col-span-1 flex items-center justify-center">
                  <input type="checkbox" className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-transparent cursor-pointer" checked={documents.length > 0 && selectedIds.length === documents.length} onChange={(e) => handleSelectAll(e, documents)} />
                </div>
                <SortableHeader label="File Name" sortKey="fileName" colSpan={2} currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="AI Document Title" sortKey="documentTitle" colSpan={2} currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="Case Number" sortKey="caseNumber" colSpan={2} currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="County" sortKey="county" colSpan={1} currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="Status" sortKey="status" colSpan={1} currentSort={sortConfig} onSort={handleSort} />
                <SortableHeader label="Date" sortKey="date" colSpan={1} currentSort={sortConfig} onSort={handleSort} />
                <div className="col-span-2 text-right">Actions</div>
              </div>

              {/* TABLE BODY */}
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {documents.map((doc) => (
                  <div key={doc.id} className={`grid grid-cols-12 gap-4 px-6 py-4 items-center transition-all duration-300 group ${selectedIds.includes(doc.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-gray-50 dark:hover:bg-[#282828]'} ${globalSearchQuery ? 'ring-inset ring-2 ring-blue-400 bg-blue-50/30 dark:bg-blue-900/20' : ''}`}>
                    
                    <div className="col-span-1 flex items-center justify-center">
                      <input type="checkbox" className={`rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-transparent cursor-pointer transition-opacity ${selectedIds.includes(doc.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} checked={selectedIds.includes(doc.id)} onChange={() => handleSelectOne(doc.id)} />                    
                    </div>
                    <div className="col-span-2 flex items-center gap-3 pr-4">
                      {user?.role === 'Admin' && (
                      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                          <button 
                            onClick={() => setActivePopoverId(activePopoverId === doc.id ? null : doc.id)}
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm transition-transform hover:scale-105
                              ${userDictionary[doc.uploaderId]?.accountType === 'Guest' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'}`}
                          >
                            {userDictionary[doc.uploaderId]?.accountType === 'Guest' ? 'GU' : `${userDictionary[doc.uploaderId]?.firstName?.[0] || ''}${userDictionary[doc.uploaderId]?.lastName?.[0] || ''}`.toUpperCase() || '??'}
                          </button>
                          {activePopoverId === doc.id && (
                            <div className="absolute top-10 left-0 z-50 w-56 p-4 bg-white dark:bg-[#2a2a2a] rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700">
                              <h4 className="font-bold text-gray-900 dark:text-white mb-2 pb-2 border-b border-gray-100 dark:border-gray-700">Uploader Details</h4>
                              <div className="space-y-1 text-sm">
                                <p><span className="text-gray-500 dark:text-gray-400">Name:</span> <span className="font-medium text-gray-900 dark:text-gray-200">{userDictionary[doc.uploaderId]?.firstName} {userDictionary[doc.uploaderId]?.lastName}</span></p>
                                <p><span className="text-gray-500 dark:text-gray-400">Account #:</span> <span className="font-medium text-gray-900 dark:text-gray-200">{doc.uploaderId}</span></p>
                                <p><span className="text-gray-500 dark:text-gray-400">Role:</span> <span className="font-medium text-gray-900 dark:text-gray-200">{userDictionary[doc.uploaderId]?.accountType}</span></p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      <div className="flex flex-col overflow-hidden w-full">
                        <button onClick={() => handleOpenDocument(doc.id)} className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 truncate text-left transition-colors">
                          {doc.fileName || doc.FileName || 'Unknown File'}
                        </button>
                      </div>
                    </div>

                    <div className="col-span-2 flex items-center pr-2 overflow-hidden">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-200 truncate">{doc.documentTitle || doc.DocumentTitle}</span>
                    </div>

                    <div className="col-span-2 flex items-center pr-2">
                      <span className="text-sm text-gray-600 dark:text-gray-400 font-mono bg-gray-100 dark:bg-[#2a2a2a] px-2 py-1 rounded truncate">{doc.caseNumber || doc.CaseNumber || 'Missing'}</span>
                    </div>

                    <div className="col-span-1 flex items-center pr-2">
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{doc.county || doc.County || 'Unknown'}</span>
                    </div>

                    <div className="col-span-1 flex items-center">
                      <StatusBadge status={doc.status || doc.Status} />
                    </div>

                    <div className="col-span-1 flex flex-col">
                      <span className="text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">{formatDate(doc.createdAt || doc.CreatedAt || doc.uploadDate)}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Uploaded</span>
                    </div>

                    <div className="col-span-2 flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setSelectedReportDocument(doc); setIsReportModalOpen(true); }} className="text-blue-500 hover:text-blue-700 text-sm font-medium">View Report</button>
                      {user?.role !== 'Guest' && (
                        <button onClick={() => handleDeleteDocument(doc.id)} className="text-red-600 hover:text-red-900 dark:text-red-500 dark:hover:text-red-400" title="Move to Recycle Bin">
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {totalPages > 1 && (
            <div className="flex flex-wrap items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-[#1a1a1a]">
              <div className="text-sm text-gray-500 dark:text-gray-400 mb-2 sm:mb-0">
                Showing <span className="font-medium text-gray-900 dark:text-white">{((pageNumber - 1) * 20) + 1}</span> to <span className="font-medium text-gray-900 dark:text-white">{Math.min(pageNumber * 20, totalCount)}</span> of <span className="font-medium text-gray-900 dark:text-white">{totalCount}</span> results
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
                  disabled={pageNumber === 1}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <div className="flex items-center px-4 font-medium text-sm text-gray-700 dark:text-gray-300">
                  Page {pageNumber} of {totalPages}
                </div>
                <button
                  onClick={() => setPageNumber(prev => Math.min(prev + 1, totalPages))}
                  disabled={pageNumber === totalPages}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}

        </div>
      )}

      <DocumentReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} document={selectedReportDocument} />
      <EditDocumentModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} selectedDocs={selectedDocumentObjects} onSuccess={fetchDocuments} />
    </div>
  );
}