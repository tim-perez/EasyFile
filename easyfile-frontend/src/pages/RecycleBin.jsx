import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthProvider';
import { useDocuments } from '../hooks/useDocuments';
import api from '../services/api';

import SortableHeader from '../components/common/SortableHeader';
import ReviewModal from '../components/features/ReviewModal'; 

export default function RecycleBin() {
  const { user } = useAuth();
  
  // 1. Reusing our custom hook by passing the specific endpoint!
  const {
    documents: processedDocuments, originalDocuments, isLoading, error, fetchDocuments,
    selectedIds, handleSelectAll, handleSelectOne, sortConfig, handleSort,
    activeFilters, setActiveFilters, uniqueOptions
  } = useDocuments('/documents/recycle');

  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);

  const [userDictionary, setUserDictionary] = useState({});
  const [activePopoverId, setActivePopoverId] = useState(null);

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

  const handleRestore = async (id) => {
    try {
      await api.post(`/documents/${id}/restore`);
      fetchDocuments();
      window.dispatchEvent(new Event('documentUploaded')); 
    } catch (error) {
      console.error("Failed to restore:", error);
    }
  };

  const handleBulkRestore = async () => {
    try {
      await Promise.all(selectedIds.map(id => api.post(`/documents/${id}/restore`)));
      fetchDocuments();
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
      fetchDocuments();
    } catch (error) {
      console.error("Failed to permanently delete:", error);
    }
  };

  const handleBulkPermanentDelete = async () => {
    const isConfirmed = window.confirm(`Permanently delete ${selectedIds.length} documents? This cannot be undone.`);
    if (!isConfirmed) return;
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/documents/${id}/permanent`)));
      fetchDocuments();
    } catch (error) {
      console.error("Failed to bulk delete:", error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown Date';
    return new Date(dateString).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const activeFilterCount = Object.values(activeFilters).filter(val => val !== '').length;

  return (
    <div className="w-full relative pb-12">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Recycle Bin</h1>

      <div className={`transition-all duration-300 ease-in-out overflow-hidden ${selectedIds.length > 0 ? 'max-h-40 opacity-100 mb-4' : 'max-h-0 opacity-0 mb-0'}`}>
        <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 shadow-sm rounded-lg px-4 py-3 flex flex-wrap lg:flex-nowrap items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <span className="text-sm font-semibold text-gray-900 dark:text-white border-r border-gray-300 dark:border-gray-700 pr-6">
              {selectedIds.length} selected
            </span>
          </div>
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

      <div className="mb-4 px-2 relative">
        <button 
          onClick={() => setIsFilterMenuOpen(!isFilterMenuOpen)}
          className={`flex items-center text-sm font-medium transition px-3 py-1.5 rounded-md ${isFilterMenuOpen || activeFilterCount > 0 ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#2a2a2a]'}`}
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" /></svg>
          Filter {activeFilterCount > 0 && `(${activeFilterCount})`}
        </button>

        {isFilterMenuOpen && (
          <div className="absolute top-full left-0 mt-2 w-full max-w-4xl bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 shadow-xl rounded-xl p-4 z-20">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">AI Document Title</label>
                <select value={activeFilters.documentTitle} onChange={(e) => setActiveFilters({...activeFilters, documentTitle: e.target.value})} className="w-full bg-gray-50 dark:bg-[#151515] border border-gray-200 dark:border-gray-700 rounded-lg text-sm p-2 outline-none focus:border-blue-500 dark:text-white">
                  <option value="">All Titles</option>
                  {uniqueOptions.titles.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Case Number</label>
                <select value={activeFilters.caseNumber} onChange={(e) => setActiveFilters({...activeFilters, caseNumber: e.target.value})} className="w-full bg-gray-50 dark:bg-[#151515] border border-gray-200 dark:border-gray-700 rounded-lg text-sm p-2 outline-none focus:border-blue-500 dark:text-white">
                  <option value="">All Cases</option>
                  {uniqueOptions.cases.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">County</label>
                <select value={activeFilters.county} onChange={(e) => setActiveFilters({...activeFilters, county: e.target.value})} className="w-full bg-gray-50 dark:bg-[#151515] border border-gray-200 dark:border-gray-700 rounded-lg text-sm p-2 outline-none focus:border-blue-500 dark:text-white">
                  <option value="">All Counties</option>
                  {uniqueOptions.counties.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Status</label>
                <select value={activeFilters.status} onChange={(e) => setActiveFilters({...activeFilters, status: e.target.value})} className="w-full bg-gray-50 dark:bg-[#151515] border border-gray-200 dark:border-gray-700 rounded-lg text-sm p-2 outline-none focus:border-blue-500 dark:text-white">
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

      <div className="bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <div className="w-full min-w-250">
            
            <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1a1a] text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <div className="col-span-1 flex items-center justify-center">
                <input 
                  type="checkbox" 
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-transparent cursor-pointer" 
                  checked={processedDocuments.length > 0 && selectedIds.length === processedDocuments.length} 
                  onChange={(e) => handleSelectAll(e, processedDocuments)} 
                />
              </div>
              <SortableHeader label="File Name" sortKey="fileName" colSpan={2} currentSort={sortConfig} onSort={handleSort} />
              <SortableHeader label="AI Document Title" sortKey="documentTitle" colSpan={2} currentSort={sortConfig} onSort={handleSort} />
              <SortableHeader label="Case Number" sortKey="caseNumber" colSpan={2} currentSort={sortConfig} onSort={handleSort} />
              <SortableHeader label="County" sortKey="county" colSpan={1} currentSort={sortConfig} onSort={handleSort} />
              <SortableHeader label="Status" sortKey="status" colSpan={1} currentSort={sortConfig} onSort={handleSort} />
              <SortableHeader label="Date" sortKey="date" colSpan={1} currentSort={sortConfig} onSort={handleSort} />
              <div className="col-span-2 text-right">Actions</div>
            </div>

            {isLoading && (
              <div className="flex justify-center items-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>
            )}

            {!isLoading && !error && processedDocuments.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 bg-gray-100 dark:bg-[#2a2a2a] rounded-full flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {originalDocuments.length === 0 ? "Recycle bin is empty." : "No documents match your filter settings."}
                </p>
              </div>
            )}

            {!isLoading && !error && processedDocuments.length > 0 && (
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {processedDocuments.map((doc) => (
                  <div key={doc.id} className={`grid grid-cols-12 gap-4 px-6 py-4 items-center transition-colors group ${selectedIds.includes(doc.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-gray-50 dark:hover:bg-[#282828]'}`}>
                    
                    <div className="col-span-1 flex items-center justify-center">
                      <input type="checkbox" className={`rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-transparent cursor-pointer transition-opacity ${selectedIds.includes(doc.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} checked={selectedIds.includes(doc.id)} onChange={() => handleSelectOne(doc.id)} />
                    </div>

                    <div className="col-span-2 flex items-center gap-3 pr-4">
                      {user?.role === 'Admin' && (
                        <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                          <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                            <button 
                              onClick={() => setActivePopoverId(activePopoverId === doc.id ? null : doc.id)}
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500
                                ${userDictionary[doc.uploaderId]?.accountType === 'Guest' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'}`}
                            >
                              {userDictionary[doc.uploaderId]?.accountType === 'Guest' ? 'GU' : `${userDictionary[doc.uploaderId]?.firstName?.[0] || ''}${userDictionary[doc.uploaderId]?.lastName?.[0] || ''}`.toUpperCase() || '??'}
                            </button>
                          </div>
                          {activePopoverId === doc.id && user?.role === 'Admin' && (
                            <div className="col-start-2 col-span-11 mt-1 mb-2 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
                              
                              <div className="w-64 bg-white dark:bg-[#2a2a2a] rounded-xl shadow-lg ring-1 ring-black ring-opacity-5 border border-transparent dark:border-gray-700 p-4">
                                <h4 className="font-bold text-sm text-gray-900 dark:text-white mb-3 pb-2 border-b border-gray-100 dark:border-gray-700">
                                  Uploader Details
                                </h4>
                                
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-500 dark:text-gray-400">Name</span> 
                                    <span className="font-medium text-gray-900 dark:text-gray-100">{userDictionary[doc.uploaderId]?.firstName} {userDictionary[doc.uploaderId]?.lastName}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-500 dark:text-gray-400">Account #</span> 
                                    <span className="font-medium text-gray-900 dark:text-gray-200">{doc.uploaderId}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                    <span className="text-gray-500 dark:text-gray-400">Role</span> 
                                    <span className="font-medium text-gray-900 dark:text-gray-200">{userDictionary[doc.uploaderId]?.accountType}</span>
                                  </div>                          
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
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
                    <div className="col-span-1 flex items-center opacity-60">
                       <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400">Recycled</span>
                    </div>
                    <div className="col-span-1 flex flex-col">
                      <span className="text-sm text-red-600 dark:text-red-400 whitespace-nowrap">{formatDate(doc.deletedAt || doc.DeletedAt || doc.createdAt || doc.CreatedAt || new Date())}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Deleted</span>
                    </div>

                    <div className="col-span-2 flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleRestore(doc.id)} className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors p-1.5 rounded-md hover:bg-green-50 dark:hover:bg-green-900/20" title="Restore Document">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                      </button>
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