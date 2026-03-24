import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import ReviewModal from './ReviewModal'; 

export default function RecycleBin() {
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [selectedIds, setSelectedIds] = useState([]);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  // NEW: SORTING & FILTERING STATE
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' }); // Default: Latest deleted date
  const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    documentTitle: '',
    caseNumber: '',
    county: '',
    status: ''
  });

  useEffect(() => {
    fetchRecycledDocuments();
  }, []);

  const fetchRecycledDocuments = async () => {
    try {
      setIsLoading(true);
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
  // CHECKBOX & ACTION LOGIC
  // ==========================================
  const handleSelectAll = (e) => {
    // NEW: Select all from PROCESSED documents, not raw documents
    if (e.target.checked) setSelectedIds(processedDocuments.map(doc => doc.id));
    else setSelectedIds([]);
  };

  const handleSelectOne = (id) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]);
  };

  const handleRestore = async (id) => {
    try {
      await api.post(`/documents/${id}/restore`);
      fetchRecycledDocuments();
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

  // ==========================================
  // NEW: FILTERING & SORTING PIPELINE
  // ==========================================
  
  const uniqueOptions = useMemo(() => {
    return {
      titles: [...new Set(documents.map(d => d.documentTitle || d.DocumentTitle).filter(Boolean))],
      cases: [...new Set(documents.map(d => d.caseNumber || d.CaseNumber).filter(Boolean))],
      counties: [...new Set(documents.map(d => d.county || d.County).filter(Boolean))],
      statuses: [...new Set(documents.map(d => d.status || d.Status).filter(Boolean))]
    };
  }, [documents]);

  const handleFilterChange = (key, value) => setActiveFilters(prev => ({ ...prev, [key]: value }));
  const clearFilters = () => {
    setActiveFilters({ documentTitle: '', caseNumber: '', county: '', status: '' });
    setIsFilterMenuOpen(false);
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const processedDocuments = useMemo(() => {
    let filtered = documents.filter(doc => {
      const matchTitle = !activeFilters.documentTitle || (doc.documentTitle || doc.DocumentTitle) === activeFilters.documentTitle;
      const matchCase = !activeFilters.caseNumber || (doc.caseNumber || doc.CaseNumber) === activeFilters.caseNumber;
      const matchCounty = !activeFilters.county || (doc.county || doc.County) === activeFilters.county;
      const matchStatus = !activeFilters.status || (doc.status || doc.Status) === activeFilters.status;
      return matchTitle && matchCase && matchCounty && matchStatus;
    });

    return filtered.sort((a, b) => {
      let aValue, bValue;

      switch (sortConfig.key) {
        case 'fileName':
          aValue = (a.fileName || a.FileName || '').toLowerCase();
          bValue = (b.fileName || b.FileName || '').toLowerCase();
          break;
        case 'documentTitle':
          aValue = (a.documentTitle || a.DocumentTitle || '').toLowerCase();
          bValue = (b.documentTitle || b.DocumentTitle || '').toLowerCase();
          break;
        case 'caseNumber':
          aValue = (a.caseNumber || a.CaseNumber || '').toLowerCase();
          bValue = (b.caseNumber || b.CaseNumber || '').toLowerCase();
          break;
        case 'county':
          aValue = (a.county || a.County || '').toLowerCase();
          bValue = (b.county || b.County || '').toLowerCase();
          break;
        case 'status':
          aValue = (a.status || a.Status || '').toLowerCase();
          bValue = (b.status || b.Status || '').toLowerCase();
          break;
        case 'date':
        default:
          // In Recycle Bin, sort by deletion date if available, otherwise creation date
          aValue = new Date(a.deletedAt || a.DeletedAt || a.createdAt || a.CreatedAt || 0).getTime();
          bValue = new Date(b.deletedAt || b.DeletedAt || b.createdAt || b.CreatedAt || 0).getTime();
          break;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [documents, activeFilters, sortConfig]);

  // NEW: Helper for Sortable Headers
  const SortableHeader = ({ label, sortKey, colSpan = 1 }) => (
    <div 
      className={`col-span-${colSpan} flex items-center cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors select-none`}
      onClick={() => handleSort(sortKey)}
    >
      {label}
      <span className="ml-1 text-[10px] text-gray-400">
        {sortConfig.key === sortKey ? (sortConfig.direction === 'asc' ? '▲' : '▼') : '↕'}
      </span>
    </div>
  );

  const activeFilterCount = Object.values(activeFilters).filter(val => val !== '').length;

  return (
    <div className="max-w-7xl mx-auto w-full relative pb-12">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Recycle Bin</h1>

      {/* SMOOTH ANIMATED ACTION BAR */}
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

      {/* NEW: FILTER BUTTON & PANEL */}
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
                <select value={activeFilters.documentTitle} onChange={(e) => handleFilterChange('documentTitle', e.target.value)} className="w-full bg-gray-50 dark:bg-[#151515] border border-gray-200 dark:border-gray-700 rounded-lg text-sm p-2 outline-none focus:border-blue-500 dark:text-white">
                  <option value="">All Titles</option>
                  {uniqueOptions.titles.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Case Number</label>
                <select value={activeFilters.caseNumber} onChange={(e) => handleFilterChange('caseNumber', e.target.value)} className="w-full bg-gray-50 dark:bg-[#151515] border border-gray-200 dark:border-gray-700 rounded-lg text-sm p-2 outline-none focus:border-blue-500 dark:text-white">
                  <option value="">All Cases</option>
                  {uniqueOptions.cases.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">County</label>
                <select value={activeFilters.county} onChange={(e) => handleFilterChange('county', e.target.value)} className="w-full bg-gray-50 dark:bg-[#151515] border border-gray-200 dark:border-gray-700 rounded-lg text-sm p-2 outline-none focus:border-blue-500 dark:text-white">
                  <option value="">All Counties</option>
                  {uniqueOptions.counties.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Status</label>
                <select value={activeFilters.status} onChange={(e) => handleFilterChange('status', e.target.value)} className="w-full bg-gray-50 dark:bg-[#151515] border border-gray-200 dark:border-gray-700 rounded-lg text-sm p-2 outline-none focus:border-blue-500 dark:text-white">
                  <option value="">All Statuses</option>
                  {uniqueOptions.statuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
              <button onClick={clearFilters} className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white transition">Clear All Filters</button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-[#1f1f1f] border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-275">
            
            {/* NEW: SORTABLE TABLE HEADER */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-[#1a1a1a] text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              <div className="col-span-1 flex items-center justify-center">
                <input 
                  type="checkbox" 
                  className="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-transparent cursor-pointer" 
                  checked={processedDocuments.length > 0 && selectedIds.length === processedDocuments.length} 
                  onChange={handleSelectAll} 
                />
              </div>
              <SortableHeader label="File Name" sortKey="fileName" colSpan={2} />
              <SortableHeader label="AI Document Title" sortKey="documentTitle" colSpan={2} />
              <SortableHeader label="Case Number" sortKey="caseNumber" colSpan={2} />
              <SortableHeader label="County" sortKey="county" colSpan={1} />
              <SortableHeader label="Status" sortKey="status" colSpan={1} />
              <SortableHeader label="Date" sortKey="date" colSpan={1} />
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
                  {documents.length === 0 ? "Recycle bin is empty." : "No documents match your filter settings."}
                </p>
              </div>
            )}

            {/* NEW: Map over processedDocuments instead of raw documents */}
            {!isLoading && !error && processedDocuments.length > 0 && (
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {processedDocuments.map((doc) => (
                  <div key={doc.id} className={`grid grid-cols-12 gap-4 px-6 py-4 items-center transition-colors group ${selectedIds.includes(doc.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-gray-50 dark:hover:bg-[#282828]'}`}>
                    
                    <div className="col-span-1 flex items-center justify-center">
                      <input type="checkbox" className={`rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 bg-transparent cursor-pointer transition-opacity ${selectedIds.includes(doc.id) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`} checked={selectedIds.includes(doc.id)} onChange={() => handleSelectOne(doc.id)} />
                    </div>

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